import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// High limit for handling base64 PDF uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System Instruction strictly mandated by user requirements
const SYSTEM_INSTRUCTION = `당신은 업로드된 문서(사내 지침, 규정, 관련 법령)를 근거로 객관적 사실을 발췌해주는 어시스턴트입니다. 다음 규칙을 철저히 지키세요.

1. 기본 원칙 (문서 기반 발췌):
- 오직 업로드된 문서에 실제로 기재된 내용만을 1차 근거로 답변합니다.
- 답변 시 어느 문서, 어느 조항/페이지에서 발췌했는지 출처를 명확히 밝힙니다.
- 사용자가 별도의 일반 상식이나 조언을 원하지 않은 일반 조회 상태에서 문서에 관련 내용이 없다면 "업로드된 문서에서 해당 내용을 찾을 수 없습니다"라고 명확히 답변하세요.

2. 일반 상식 및 조언 요청 시 (사용자가 원하거나 질문에 포함된 경우):
- 사용자가 "일반 상식으로 알려줘", "조언해줘", "규정에 없으면 상식선에서 말해줘", "노무/행정 실무 조언", "일반적인 근로기준법/법령 기준" 등 일반적 지식이나 조언을 원하거나 요청하는 문구가 포함된 경우:
  ① 업로드된 문서에서 확인되는 내용을 먼저 작성합니다.
  ② 문서에 없거나 추가 설명이 필요할 경우, 문서 내용과 명확히 구분하여 "💡 [일반 상식 및 실무 조언 (문서 외 참고 정보)]" 섹션을 추가하고, 사실에 기반한 최신 법령 상식, 일반적인 인사/노무/행정 실무 관례 및 조언을 객관적이고 사실적으로 제시하세요.
- 이때 "본 조언은 업로드된 문서 외 일반 상식 및 실무 참고용 안내입니다"라는 취지를 함께 명시하십시오.`;

const FORMATTING_GUIDE = `

[답변 작성 방식]
질문에 답변할 때 다음 5단계 구분을 활용하여 작성해 주세요:

1. 📌 [발췌 답변]
- 업로드된 문서에 명시된 사실만을 객관적으로 작성합니다. 사실이 여러 개면 번호/항목별로 정리합니다.

2. 📜 [근거 원문 인용]
- 관련 문서의 실제 조항 문장을 큰따옴표("")로 원문 그대로 인용합니다. (문서에 내용이 있는 경우)

3. 🏷️ [출처]
- 발췌한 문서명과 조항/페이지 등 구체적 위치를 적습니다. (예: [2026_취업규칙.txt] 제15조 제3항)

4. ⚠️ [미확인 내용]
- 질문 내용 중 업로드된 문서에서 확인할 수 없는 부분이 있다면 명확히 밝힙니다.

5. 💡 [일반 상식 및 실무 조언 (문서 외 참고 정보)]
- **사용자가 일반 상식, 실무 조언, 법령 상식, 또는 규정 외 가이드를 원하거나 질문에 요청이 포함된 경우에만 작성합니다.**
- 최신 법령 상식, 일반적인 인사/노무 및 행정 실무 관례 등 사실적이고 객관적인 조언을 작성하세요.

*사용자가 일반 상식/조언을 요구하지 않은 일반 조회 질문이고, 답변할 수 있는 내용이 업로드된 문서 어디에도 전혀 없다면 오직 "업로드하신 문서에서는 해당 내용을 찾을 수 없습니다"라고만 답변하십시오.*
*여러 문서 간 동일 사안에 대해 명시된 내용이 상충될 경우, 이를 통합하거나 판단하지 말고 두 문서의 내용을 각각 명시하고 "문서 간 내용 상충"을 밝히십시오.*`;

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Document Fact Extraction API Route
app.post('/api/ask', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Vercel 환경 변수에 GEMINI_API_KEY가 등록되어 있지 않습니다. Vercel 프로젝트 대시보드 [Settings] -> [Environment Variables]에서 GEMINI_API_KEY 키를 등록 후 재배포해 주세요.'
      });
    }

    const { question, documents, history, includeFacts, includeAdvice, answerMode } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: '질문 내용(question)이 필요합니다.' });
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        error: '최소 1개 이상의 문서가 선택되어 있어야 합니다. 상단에서 문서를 업로드하거나 활성화해주세요.'
      });
    }

    const ai = getGeminiClient();

    // Prepare contents array for Gemini
    const contents: any[] = [];

    // Add document parts
    let docContextPrompt = `다음은 사용자가 조회/발췌하고자 업로드한 총 ${documents.length}건의 문서 내용입니다:\n\n`;

    const parts: any[] = [{ text: docContextPrompt }];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      parts.push({ text: `=== [문서 ${i + 1}/${documents.length}] 파일명: "${doc.name}" (유형: ${doc.type}) ===\n` });

      if (doc.dataBase64) {
        // PDF or Image binary file
        parts.push({
          inlineData: {
            mimeType: doc.mimeType || (doc.type === 'pdf' ? 'application/pdf' : 'image/png'),
            data: doc.dataBase64,
          },
        });
        parts.push({ text: `\n[위 파일 "${doc.name}"의 본문 내용에 기재된 사실만 추출하십시오]\n\n` });
      } else if (doc.textContent) {
        // Text/HWPX extracted content
        parts.push({
          text: `[문서 텍스트 본문 시작: ${doc.name}]\n${doc.textContent}\n[문서 텍스트 본문 끝: ${doc.name}]\n\n`
        });
      }
    }

    // Mode-specific instructions based on independent checkboxes
    const factsEnabled = includeFacts !== undefined ? Boolean(includeFacts) : (answerMode !== 'with_advice');
    const adviceEnabled = includeAdvice !== undefined ? Boolean(includeAdvice) : (answerMode === 'with_advice');

    let modeDirective = '';
    if (factsEnabled && adviceEnabled) {
      modeDirective = `\n🎯 [사용자 답변 구조 선택: 🔒 첨부파일·법령 사실 발췌 + 💡 일반 상식·실무 조언 동시 포함 모드]
- 1~4단계(발췌 답변, 근거 원문 인용, 출처, 미확인 내용)에서는 업로드된 문서 및 법령에 기재된 정확한 원문 사실과 근거를 발췌하십시오.
- 이어 5단계 "💡 [일반 상식 및 실무 조언 (문서 외 참고 정보)]" 섹션을 추가하여, 관련 행정/노무/법령 상식 및 실무자를 위한 유용한 조언을 친절하고 객관적으로 제공하십시오.`;
    } else if (adviceEnabled) {
      modeDirective = `\n🎯 [사용자 답변 구조 선택: 💡 일반 상식 및 실무 조언 전용 모드]
- 업로드된 문서 원문 사실 발췌 외에, 사용자의 질문에 대한 일반적인 법령·노무·행정 실무 상식 및 실무적 권장 조언을 중심으로 답변하십시오.
- 5단계 "💡 [일반 상식 및 실무 조언]" 섹션을 반드시 포함하여 작성해 주세요.`;
    } else {
      modeDirective = `\n🎯 [사용자 답변 구조 선택: 🔒 첨부파일·법령 사실 발췌 전용 모드]
- 오직 업로드된 첨부파일 및 법령 원문에 실제로 적힌 내용만을 근거로 객관적 사실 및 조항 원문을 답변하십시오.
- 일반 상식, 추측, 미기재 사안에 대한 자의적 조언은 일절 배제하고 5단계 [일반 상식 및 실무 조언] 섹션은 제외하십시오. 문서에 내용이 없으면 "업로드된 문서에서는 해당 내용을 찾을 수 없습니다"라고만 명확히 안내하십시오.`;
    }

    // Append formatting guide and mode directive
    parts.push({ text: FORMATTING_GUIDE });
    parts.push({ text: modeDirective });

    // History (if provided)
    if (history && Array.isArray(history) && history.length > 0) {
      parts.push({ text: `\n[이전 대화 맥락 참고 (단, 항상 답변 근거는 위 업로드 문서에 한함)]:` });
      for (const msg of history.slice(-4)) {
        parts.push({ text: `${msg.role === 'user' ? '사용자' : '어시스턴트'}: ${msg.content}` });
      }
    }

    // Final user question
    parts.push({ text: `\n[사용자의 질문]: ${question}\n\n선택된 답변 구조 지침에 따라 명확하게 답변해 주세요.` });

    contents.push({ parts });

    // Call Gemini generateContent with low temperature for strict factual accuracy
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // Low temperature for minimum hallucination & creative generation
      },
    });

    const responseText = response.text || '답변을 생성하지 못했습니다.';
    const isNotFound = responseText.includes('찾을 수 없습니다') || responseText.includes('확인할 수 없습니다');

    return res.json({
      answer: responseText,
      rawText: responseText,
      isNotFound
    });

  } catch (error: any) {
    console.error('Error generating document answer:', error);
    return res.status(500).json({
      error: error.message || '문서 발췌 과정에서 오류가 발생했습니다. 파일 형식을 확인하고 다시 시도해 주세요.'
    });
  }
});

// Only start standalone server when not in Vercel Serverless environment
async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
