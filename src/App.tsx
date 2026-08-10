import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  ArrowDown,
  CheckSquare
} from 'lucide-react';
import { Header } from './components/Header';
import { DocumentUploader } from './components/DocumentUploader';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SuggestedQuestions } from './components/SuggestedQuestions';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { LawSearchModal } from './components/LawSearchModal';
import { DocumentFile, ChatMessage } from './types';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { LawItem } from './data/statutoryLaws';

export default function App() {
  // Document state initialized with sample Korean welfare facility documents
  const [documents, setDocuments] = useState<DocumentFile[]>(SAMPLE_DOCUMENTS);
  const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);
  const [isLawModalOpen, setIsLawModalOpen] = useState(false);

  // Answer structure checkboxes (독립 다중 선택 가능)
  const [includeFacts, setIncludeFacts] = useState<boolean>(true);
  const [includeAdvice, setIncludeAdvice] = useState<boolean>(false);

  const toggleFacts = () => {
    if (includeFacts && !includeAdvice) return; // 최소 1개는 선택 유지
    setIncludeFacts(!includeFacts);
  };

  const toggleAdvice = () => {
    if (includeAdvice && !includeFacts) return; // 최소 1개는 선택 유지
    setIncludeAdvice(!includeAdvice);
  };

  // Initial welcome message
  const initialWelcomeMessage: ChatMessage = {
    id: 'msg-welcome',
    role: 'assistant',
    content: `안녕하세요! **사내규정·법령 사실발췌 어시스턴트**입니다.

사회복지시설, 장애인생산품 생산시설 및 기업 내부지침 문서를 업로드하시면, 오직 **문서에 실제로 적혀 있는 객관적 사실**만을 근거 조항 원문 및 출처(파일명+조/항)와 함께 발췌해 드립니다.

📌 **시스템 운영 원칙:**
1. **100% 문서 내용에 근거한 사실 발췌** (외부 상식, 배경지식 및 자의적 추측 절대 배제)
2. 문서에 기재되어 있지 않은 내용은 **"업로드하신 문서에서는 해당 내용을 찾을 수 없습니다"**라고 명확히 안내
3. 발췌 사실, 관련 근거 조항 원문 인용, 출처(파일명/조항)를 순서대로 정리

상단에서 규정 문서(PDF, HWPX, TXT)를 업로드하거나 예시 질문을 선택하여 시작하세요.`,
    timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    documentsUsed: SAMPLE_DOCUMENTS.map(d => d.name)
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('문서 컨텍스트 대조 중...');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Document Handlers
  const handleAddDocument = (newDoc: DocumentFile) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleToggleDocument = (id: string) => {
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleLoadSamples = () => {
    // Add sample docs if not present
    setDocuments(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const newSamples = SAMPLE_DOCUMENTS.filter(s => !existingIds.has(s.id));
      if (newSamples.length === 0) {
        // Toggle all existing to enabled
        return prev.map(d => ({ ...d, enabled: true }));
      }
      return [...newSamples, ...prev];
    });
  };

  const handleImportLaw = (law: LawItem) => {
    const lawDocName = `[대한민국 법률] ${law.lawName}.txt`;
    
    // Check if already exists
    if (documents.some(d => d.name === lawDocName)) {
      setDocuments(prev => prev.map(d => d.name === lawDocName ? { ...d, enabled: true } : d));
      return;
    }

    const lawDoc: DocumentFile = {
      id: 'law-' + law.id + '-' + Date.now(),
      name: lawDocName,
      type: 'txt',
      size: new Blob([law.textContent]).size,
      mimeType: 'text/plain',
      textContent: law.textContent,
      enabled: true,
      uploadedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      note: `국가법령정보센터(law.go.kr) ${law.lawName} 원문`
    };

    setDocuments(prev => [lawDoc, ...prev]);
  };

  // Submit Question to /api/ask
  const handleSendMessage = async (queryText?: string) => {
    const questionToAsk = queryText || inputQuery;
    if (!questionToAsk.trim() || isLoading) return;

    const enabledDocs = documents.filter(d => d.enabled);

    if (enabledDocs.length === 0) {
      alert('활성화된 문서가 없습니다. 상단에서 최소 1개 이상의 규정 문서를 선택하거나 업로드해 주세요.');
      return;
    }

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: questionToAsk,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);
    setLoadingStep('업로드 문서 조항 및 텍스트 대조 중...');

    try {
      // Step feedback animation timer
      const timer = setTimeout(() => {
        setLoadingStep('Gemini 엔진을 통한 조항 및 인용문 발췌 중...');
      }, 1500);

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionToAsk,
          includeFacts,
          includeAdvice,
          documents: enabledDocs.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            mimeType: d.mimeType,
            dataBase64: d.dataBase64,
            textContent: d.textContent,
          })),
          history: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorMessage = `서버 오류 (${response.status})`;
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch {
          const rawText = await response.text();
          if (rawText.toLowerCase().includes('gemini_api_key')) {
            errorMessage = 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트 환경 변수에 GEMINI_API_KEY를 등록해 주세요.';
          } else {
            errorMessage = `서버에서 오류 응답을 반환했습니다 (${response.status}). Vercel 환경변수(GEMINI_API_KEY) 설정을 확인해 주세요.`;
          }
        }
        throw new Error(errorMessage);
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('서버 응답 형식이 올바르지 않습니다. (Vercel 환경 변수의 GEMINI_API_KEY 설정 여부를 확인해 주세요.)');
      }

      const assistantMessage: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.answer || '답변이 생성되지 않았습니다.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        isNotFound: data.isNotFound,
        documentsUsed: enabledDocs.map(d => d.name),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error asking question:', error);
      const errorMessage: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ 오류가 발생했습니다: ${error.message || '요청 처리 중 오류가 발생했습니다.'}\n문서 형식을 다시 확인하시거나 상단 샘플 문서를 이용하여 재시도해 보세요.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('대화 내역을 모두 초기화하시겠습니까?')) {
      setMessages([initialWelcomeMessage]);
    }
  };

  const activeDocCount = documents.filter(d => d.enabled).length;

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-sans text-[#3D473A] flex flex-col antialiased">
      {/* Header */}
      <Header 
        activeDocCount={activeDocCount} 
        totalDocCount={documents.length}
        onOpenLawModal={() => setIsLawModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 flex flex-col">
        {/* Document Uploader Section */}
        <DocumentUploader
          documents={documents}
          onAddDocument={handleAddDocument}
          onRemoveDocument={handleRemoveDocument}
          onToggleDocument={handleToggleDocument}
          onPreviewDocument={setPreviewDoc}
          onLoadSamples={handleLoadSamples}
          onOpenLawModal={() => setIsLawModalOpen(true)}
        />

        {/* Suggested Questions */}
        <SuggestedQuestions
          onSelectQuestion={(q) => handleSendMessage(q)}
          disabled={isLoading}
        />

        {/* Chat History Panel */}
        <div className="flex-1 bg-[#FBFBFA] border border-[#E8E4D9] rounded-2xl p-4 sm:p-6 mb-24 shadow-2xs flex flex-col min-h-[350px]">
          {/* Messages List */}
          <div className="flex-1 space-y-4">
            {messages.map(msg => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center space-x-3 bg-white border border-[#E8E4D9] px-4 py-3 rounded-2xl rounded-tl-none shadow-xs text-xs sm:text-sm text-[#3D473A]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#5A6F54] shrink-0" />
                  <div>
                    <p className="font-bold text-[#3D473A]">{loadingStep}</p>
                    <p className="text-[11px] text-[#8A8F85]">
                      실제 문서에 적힌 내용만을 추측 없이 정교히 발췌하는 중입니다...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Input Area */}
      <footer className="fixed bottom-0 inset-x-0 bg-[#FDFCF9]/95 backdrop-blur-md border-t border-[#E8E4D9] p-3 sm:p-4 z-20 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col space-y-2">
          {/* Answer Structure Checkbox Selection Bar */}
          <div className="bg-[#F6F4ED] border border-[#E8E4D9] rounded-xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-1.5 text-[#3D473A] font-bold px-1 shrink-0">
              <CheckSquare className="w-4 h-4 text-[#5A6F54]" />
              <span>답변 방식 선택 (다중 선택 가능):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 flex-1">
              {/* Option 1: Strictly facts only */}
              <label 
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none ${
                  includeFacts 
                    ? 'bg-white border-[#5A6F54] text-[#3D473A] font-bold shadow-2xs ring-1 ring-[#5A6F54]/30' 
                    : 'bg-[#FDFCF9] border-[#E8E4D9] text-[#7A8075] hover:bg-white hover:text-[#3D473A]'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={includeFacts} 
                  onChange={toggleFacts} 
                  className="rounded text-[#5A6F54] focus:ring-[#5A6F54] w-4 h-4 accent-[#5A6F54] cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <span>🔒</span>
                  <span>첨부파일·법령 <strong>사실만 발췌</strong></span>
                </span>
              </label>

              {/* Option 2: Facts + General commonsense advice */}
              <label 
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none ${
                  includeAdvice 
                    ? 'bg-white border-[#5A6F54] text-[#3D473A] font-bold shadow-2xs ring-1 ring-[#5A6F54]/30' 
                    : 'bg-[#FDFCF9] border-[#E8E4D9] text-[#7A8075] hover:bg-white hover:text-[#3D473A]'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={includeAdvice} 
                  onChange={toggleAdvice} 
                  className="rounded text-[#5A6F54] focus:ring-[#5A6F54] w-4 h-4 accent-[#5A6F54] cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <span>💡</span>
                  <span>일반 상식 &amp; <strong>실무 조언 포함</strong></span>
                </span>
              </label>
            </div>
          </div>

          {/* Document indicator bar above input */}
          <div className="flex items-center justify-between text-xs text-[#8A8F85] px-1">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5A6F54]" />
              <span>
                조회 대상: <strong className="text-[#5A6F54]">{activeDocCount}개 문서 활성화됨</strong>
                {includeFacts && includeAdvice && (
                  <span className="ml-1 text-[#5A6F54] font-semibold">(🔒 사실발췌 + 💡 실무조언 동시 적용)</span>
                )}
                {includeFacts && !includeAdvice && (
                  <span className="ml-1 text-[#5A6F54] font-semibold">(🔒 100% 원문 사실 발췌 모드)</span>
                )}
                {!includeFacts && includeAdvice && (
                  <span className="ml-1 text-[#C87D20] font-semibold">(💡 일반상식·실무조언 전용 모드)</span>
                )}
              </span>
            </span>

            {messages.length > 1 && (
              <button
                onClick={handleClearChat}
                className="text-[#8A8F85] hover:text-red-600 flex items-center space-x-1 cursor-pointer transition"
                title="대화 내역 비우기"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">대화 초기화</span>
              </button>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                activeDocCount > 0
                  ? includeFacts && !includeAdvice
                    ? '질문하세요 (예: 연차유급휴가 수당 지급 기준, 세금계산서 작성 시기...)'
                    : '질문하세요 (문서 사실 발췌와 함께 관련 노무·행정 실무 조언이 제공됩니다)'
                  : '상단에서 규정 문서를 먼저 선택하거나 업로드해 주세요'
              }
              disabled={isLoading || activeDocCount === 0}
              className="flex-1 bg-white border border-[#E8E4D9] focus:border-[#5A6F54] focus:bg-white focus:ring-2 focus:ring-[#5A6F54]/20 rounded-xl px-4 py-3 text-sm sm:text-base text-[#3D473A] placeholder-[#8A8F85] outline-none transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            />

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim() || activeDocCount === 0}
              className="bg-[#5A6F54] hover:bg-[#4A5C45] active:bg-[#3D473A] text-white px-5 py-3 rounded-xl font-bold transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 sm:mr-1.5" />
                  <span className="hidden sm:inline text-sm">
                    {includeFacts && includeAdvice ? '사실+조언' : includeFacts ? '사실발췌' : '실무조언'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </footer>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Law Search Modal (law.go.kr) */}
      <LawSearchModal
        isOpen={isLawModalOpen}
        onClose={() => setIsLawModalOpen(false)}
        activeDocuments={documents}
        onImportLaw={handleImportLaw}
      />
    </div>
  );
}
