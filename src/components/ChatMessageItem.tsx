import React, { useState } from 'react';
import { 
  User, 
  Bot, 
  Quote, 
  FileText, 
  AlertTriangle, 
  Copy, 
  Check, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { ChatMessage } from '../types';
import { parseResponseText } from '../utils/responseParser';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start max-w-2xl space-x-2">
          <div className="bg-[#5A6F54] text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-xs text-sm sm:text-base leading-relaxed">
            <p className="font-medium">{message.content}</p>
            <span className="text-[10px] text-[#EDE9DE] mt-1 block text-right">
              {message.timestamp}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#3D473A] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message parsing
  const parsed = parseResponseText(message.content);

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start max-w-3xl space-x-3 w-full">
        {/* Assistant Avatar */}
        <div className="w-9 h-9 rounded-xl bg-[#5A6F54] text-white border border-[#4A5C45] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Bot className="w-5 h-5" />
        </div>

        {/* Message Content Container */}
        <div className="flex-1 bg-[#FBFBFA] border border-[#E8E4D9] rounded-2xl rounded-tl-none p-4 sm:p-5 shadow-xs space-y-4 text-[#3D473A] text-sm sm:text-base leading-relaxed">
          {/* Top Bar with Time & Copy */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E4D9] text-xs text-[#8A8F85]">
            <div className="flex items-center space-x-1.5 font-semibold text-[#3D473A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5A6F54]"></span>
              <span>사실발췌 결과</span>
              {message.documentsUsed && message.documentsUsed.length > 0 && (
                <span className="text-[#8A8F85] font-normal">
                  (참조 문서: {message.documentsUsed.length}건)
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#8A8F85]">{message.timestamp}</span>
              <button
                onClick={handleCopy}
                className="p-1 text-[#8A8F85] hover:text-[#3D473A] hover:bg-[#F5F2EA] rounded-md transition cursor-pointer flex items-center space-x-1"
                title="답변 전체 복사"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#5A6F54]" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? '복사됨' : '복사'}</span>
              </button>
            </div>
          </div>

          {/* Special Warning if NOT FOUND */}
          {parsed.isNotFound ? (
            <div className="bg-[#FFFBEB] border-l-4 border-amber-600 p-3 rounded-r-xl text-amber-900 border border-[#FEF3C7]">
              <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>업로드 문서 내 미기재 (확인 불가)</span>
              </div>
            </div>
          ) : (
            /* Structured Fact Extraction View */
            <div className="space-y-4">
              {/* Section 1: Answer / Facts */}
              {parsed.answerFacts.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-[#3D473A] text-sm sm:text-base border-b border-[#E8E4D9] pb-1">
                    <CheckCircle2 className="w-4 h-4 text-[#5A6F54] shrink-0" />
                    <span>📌 발췌 사실 답변</span>
                  </div>
                  <div className="space-y-2 text-[#3D473A] text-sm sm:text-base pl-1">
                    {parsed.answerFacts.map((fact, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {fact}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                /* Fallback to raw text if parsing wasn't standard */
                <div className="whitespace-pre-wrap text-[#3D473A] leading-relaxed">
                  {message.content}
                </div>
              )}

              {/* Section 2: Quotes Box */}
              {parsed.quotes.length > 0 && (
                <div className="bg-[#F5F2EA] border-l-4 border-[#5A6F54] p-4 rounded-r-2xl space-y-2.5 border border-y-[#E8E4D9] border-r-[#E8E4D9]">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#5A6F54] uppercase tracking-wider">
                    <Quote className="w-4 h-4 text-[#5A6F54]" />
                    <span>📜 관련 근거 조항 원문 인용</span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {parsed.quotes.map((q, idx) => (
                      <blockquote key={idx} className="italic text-xs sm:text-sm text-[#3D473A] font-serif leading-relaxed bg-white/90 p-3 rounded-xl border border-[#DFD9C9] shadow-2xs">
                        &quot;{q.text}&quot;
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Sources Badges */}
              {parsed.sources.length > 0 && (
                <div className="bg-[#F5F2EA]/60 p-3.5 rounded-xl space-y-2 border border-[#E8E4D9]">
                  <div className="flex items-center space-x-1 text-xs font-bold text-[#3D473A]">
                    <FileText className="w-3.5 h-3.5 text-[#5A6F54]" />
                    <span>🏷️ 출처 (파일명 및 조항 위치)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {parsed.sources.map((src, idx) => (
                      <span key={idx} className="bg-white text-[#3D473A] text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#DFD9C9] shadow-2xs flex items-center">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Unconfirmed Parts or Conflicts */}
              {parsed.unconfirmed.length > 0 && (
                <div className="bg-[#FFFBEB] border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center space-x-1 font-bold text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚠️ 미확인 및 안내 사항</span>
                  </div>
                  {parsed.unconfirmed.map((un, idx) => (
                    <p key={idx} className="pl-4">{un}</p>
                  ))}
                </div>
              )}

              {/* Section 5: General Advice & Common Knowledge (User Requested) */}
              {parsed.generalAdvice.length > 0 && (
                <div className="bg-[#F4F6F2] border-l-4 border-[#3D473A] p-4 rounded-r-2xl space-y-2 border border-[#DFD9C9] shadow-2xs">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#3D473A]">
                    <Lightbulb className="w-4 h-4 text-[#5A6F54] shrink-0" />
                    <span>💡 일반 상식 및 실무 조언 (문서 외 참고 정보)</span>
                  </div>
                  <div className="space-y-1.5 text-xs sm:text-sm text-[#3D473A] pl-1 leading-relaxed">
                    {parsed.generalAdvice.map((adv, idx) => (
                      <p key={idx}>{adv}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legal Disclaimer Footer */}
          <div className="pt-2 border-t border-[#E8E4D9] text-[11px] text-[#8A8F85] flex items-center justify-between">
            <span className="flex items-center">
              <Info className="w-3 h-3 mr-1 text-[#8A8F85] shrink-0" />
              업로드 문서의 구체적 문구 전달목적 (법적 최종 자문/판단은 법률 전문가 확인 필요)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
