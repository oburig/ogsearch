import React from 'react';
import { X, FileText, Download, CheckCircle, Info } from 'lucide-react';
import { DocumentFile } from '../types';

interface DocumentPreviewModalProps {
  document: DocumentFile | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E8E4D9] shadow-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[85vh] h-full flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#3D473A] text-white flex items-center justify-between border-b border-[#3D473A] shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-[#5A6F54] text-white shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">{document.name}</h3>
              <p className="text-[11px] sm:text-xs text-[#EDE9DE] flex items-center space-x-2 truncate">
                <span>유형: {document.type.toUpperCase()}</span>
                <span>•</span>
                <span>업로드: {document.uploadedAt}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#EDE9DE] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 bg-[#F8F7F4]">
          <div className="bg-white p-4 rounded-xl border border-[#E8E4D9] shadow-2xs space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#3D473A]">
              <CheckCircle className="w-4 h-4 text-[#5A6F54]" />
              <span>문서 상태 및 주석</span>
            </div>
            <p className="text-xs text-[#3D473A]">
              {document.note || '정상적으로 파싱되어 질문 발췌 대상에 등록되어 있습니다.'}
            </p>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#3D473A]">
              <span>발췌용 파싱 텍스트 미리보기</span>
              {document.textContent && (
                <span className="text-[#8A8F85] font-normal">
                  (총 {document.textContent.length.toLocaleString()}자)
                </span>
              )}
            </div>

            {document.textContent ? (
              <pre className="bg-white p-4 rounded-xl border border-[#E8E4D9] text-xs sm:text-sm text-[#3D473A] font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto shadow-2xs">
                {document.textContent}
              </pre>
            ) : document.dataBase64 ? (
              <div className="bg-white p-8 rounded-xl border border-[#E8E4D9] text-center space-y-2 shadow-2xs">
                <Info className="w-8 h-8 text-[#5A6F54] mx-auto" />
                <p className="text-sm font-bold text-[#3D473A]">
                  PDF / 바이너리 멀티모달 문서 (Gemini 비전/PDF 네이티브 파싱)
                </p>
                <p className="text-xs text-[#8A8F85] max-w-md mx-auto">
                  이 문서는 PDF 바이너리 형식 그대로 Gemini AI 엔진에 전달되어 시각적 구조(레이아웃, 표, 서식)와 조항 텍스트를 원본 그대로 분석합니다.
                </p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-[#E8E4D9] text-center text-xs text-[#8A8F85]">
                추출된 텍스트 내용이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-[#E8E4D9] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#5A6F54] hover:bg-[#4A5C45] text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
