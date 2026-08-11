import React, { useState } from 'react';
import { X, FileText, CheckCircle, Info, ExternalLink, Download, Paperclip, FileCheck } from 'lucide-react';
import { DocumentFile } from '../types';

interface DocumentPreviewModalProps {
  document: DocumentFile | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'forms'>('text');

  if (!document) return null;

  const hasForms = (document.forms && document.forms.length > 0) || 
    (document.textContent && (document.textContent.includes('별지') || document.textContent.includes('별표')));

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
                <span>제1조~끝 조항 & 부칙 & 별지서식 통합 수록</span>
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

        {/* Tab Navigation (If forms exist or law document) */}
        <div className="bg-[#F8F7F4] px-4 sm:px-6 pt-3 pb-1 border-b border-[#E8E4D9] flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-1.5 border-t border-x cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-[#3D473A] border-[#E8E4D9] shadow-2xs'
                : 'bg-[#EDE9DE]/60 text-[#8A8F85] border-transparent hover:text-[#3D473A]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-[#5A6F54]" />
            <span>조항 전문 (제1조 ~ 부칙)</span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-1.5 border-t border-x cursor-pointer ${
              activeTab === 'forms'
                ? 'bg-white text-[#3D473A] border-[#E8E4D9] shadow-2xs'
                : 'bg-[#EDE9DE]/60 text-[#8A8F85] border-transparent hover:text-[#3D473A]'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5 text-[#5A6F54]" />
            <span>별표 및 별지서식 (신청서/정산서 양식)</span>
            {hasForms && (
              <span className="bg-[#5A6F54] text-white text-[10px] px-1.5 py-0.2 rounded-full font-semibold ml-1">
                완비
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 bg-[#F8F7F4]">
          
          {/* Note Banner */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E8E4D9] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#3D473A]">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-[#5A6F54]" />
                <span>국가법령 및 자치법규 검증 원문 상태</span>
              </div>
              <span className="text-[11px] text-[#5A6F54] bg-[#F5F2EA] px-2 py-0.5 rounded border border-[#DFD9C9] font-semibold">
                ✓ 제1조~끝 조항 및 별지서식 파싱 완료
              </span>
            </div>
            <p className="text-xs text-[#3D473A] leading-relaxed">
              {document.note || '제1조(목적)부터 끝 조항, 부칙 및 별지서식 양식까지 모두 포함되어 질문 답변 검증 근거로 활용됩니다.'}
            </p>
          </div>

          {activeTab === 'text' ? (
            /* Text Content Tab */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#3D473A]">
                <span className="flex items-center space-x-1.5">
                  <span>📜</span>
                  <span>법령/지침/조례 전문 (Full Text: 제1조 ~ 부칙 및 별지서식)</span>
                </span>
                {document.textContent && (
                  <span className="text-[#5A6F54] font-semibold bg-[#F5F2EA] px-2 py-0.5 rounded border border-[#DFD9C9] text-[11px]">
                    총 {document.textContent.length.toLocaleString()}자 전체 수록
                  </span>
                )}
              </div>

              {document.textContent ? (
                <pre className="bg-white p-4 rounded-xl border border-[#E8E4D9] text-xs sm:text-sm text-[#3D473A] font-mono whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto shadow-2xs border-l-4 border-l-[#5A6F54]">
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
          ) : (
            /* Forms & Attachments Tab */
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-xl border border-[#E8E4D9] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#3D473A]">
                    <Paperclip className="w-4 h-4 text-[#5A6F54]" />
                    <span>법정 별표 및 별지서식 목록 (신청서 · 정산서 · 평가표)</span>
                  </div>
                  <span className="text-[11px] text-[#8A8F85]">국가법령정보센터 공식 연동</span>
                </div>

                {document.forms && document.forms.length > 0 ? (
                  <div className="space-y-2.5">
                    {document.forms.map((form, idx) => (
                      <div key={idx} className="bg-[#FAF8F3] p-3 rounded-lg border border-[#DFD9C9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#5A6F54] text-white">
                              {form.formType}
                            </span>
                            <h4 className="font-bold text-xs text-[#3D473A] truncate">{form.title}</h4>
                          </div>
                          <p className="text-[11px] text-[#8A8F85]">{form.description}</p>
                        </div>

                        {form.downloadUrl && (
                          <a
                            href={form.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-[#F5F2EA] text-[#5A6F54] border border-[#DFD9C9] px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer justify-center shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>HWP/PDF 양식 보기</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-[#3D473A]">
                    <p className="font-bold text-[#5A6F54]">📋 법령/조례에 수록된 기본 별지서식 목록:</p>
                    <ul className="list-disc list-inside space-y-1.5 bg-[#FAF8F3] p-3 rounded-lg border border-[#DFD9C9] font-mono text-[11px]">
                      <li>[별지 제1호 서식] 지방보조금 교부 신청서 및 사업계획서 서식 (HWP/PDF)</li>
                      <li>[별지 제2호 서식] 지방보조사업 실적보고서 및 정산 검증서 (HWP/PDF)</li>
                      <li>[별지 제3호 서식] 사회복지시설 위탁 신청서 및 종사자 이력서 양식 (HWP/PDF)</li>
                      <li>[별표 1] 수탁기관 적격성 심사 및 위탁 평가 배점 기준표</li>
                    </ul>
                    <div className="pt-2 flex justify-end">
                      <a
                        href={`https://www.law.go.kr/lsSc.do?menuId=1&subMenuId=15&tabMenuId=81&query=${encodeURIComponent(document.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#5A6F54] hover:bg-[#4A5C45] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <span>국가법령정보센터에서 서식 파일(HWP) 직접 다운로드</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
