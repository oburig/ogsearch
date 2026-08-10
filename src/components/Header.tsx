import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Info, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface HeaderProps {
  activeDocCount: number;
  totalDocCount: number;
  onOpenLawModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeDocCount, totalDocCount, onOpenLawModal }) => {
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <header className="bg-white border-b border-[#E8E4D9] sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A6F54] flex items-center justify-center text-white shadow-sm font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#3D473A]">
                사내규정·법령 사실발췌 도구
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#F5F2EA] text-[#5A6F54] border border-[#DFD9C9]">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Fact-Only Grounding
              </span>
            </div>
            <p className="text-xs text-[#8A8F85]">
              사회복지시설 및 기업 내부지침·규정 문서 기반 객관적 사실 발췌 어시스턴트
            </p>
          </div>
        </div>

        {/* Right side stats & info button */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs">
          <button
            onClick={onOpenLawModal}
            className="bg-[#5A6F54] hover:bg-[#4A5C45] text-white px-2.5 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 sm:space-x-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#5A6F54] whitespace-nowrap"
            title="국가법령정보센터(law.go.kr) 법률 검색 및 선택"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">국가법령 연동</span>
            <span className="xs:hidden">법령</span>
            <span className="hidden lg:inline">(law.go.kr)</span>
          </button>

          <div className="bg-[#F8F7F4] text-[#3D473A] px-2.5 py-1.5 rounded-lg border border-[#E8E4D9] flex items-center space-x-1 shrink-0 whitespace-nowrap">
            <FileText className="w-3.5 h-3.5 text-[#5A6F54] shrink-0" />
            <span>
              활성: <strong className="text-[#5A6F54] font-semibold">{activeDocCount}</strong>/{totalDocCount}건
            </span>
          </div>

          <button
            onClick={() => setShowGuideModal(true)}
            className="bg-[#F5F2EA] hover:bg-[#EDE9DE] text-[#3D473A] px-2.5 py-1.5 rounded-lg border border-[#E8E4D9] transition flex items-center space-x-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5A6F54] shrink-0"
            title="검증 원칙 및 지침 확인"
          >
            <Info className="w-4 h-4 text-[#5A6F54] shrink-0" />
            <span className="hidden md:inline font-medium">검증 원칙</span>
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-[#FDFCF9] text-slate-800 rounded-2xl border border-[#E8E4D9] shadow-2xl max-w-lg w-full p-6 relative overflow-hidden animate-in fade-in duration-200">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-[#8A8F85] hover:text-[#3D473A] p-1 rounded-lg hover:bg-[#F5F2EA] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#5A6F54] mb-3">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-lg font-bold text-[#3D473A]">사실발췌 및 결과 검증 원칙</h2>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="bg-[#F8F7F4] p-3.5 rounded-xl border border-[#E8E4D9] space-y-1.5">
                <p className="font-semibold text-[#5A6F54] flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                  1. 100% 문서 내용 근거 발췌
                </p>
                <p className="text-[#7A7463] pl-5 leading-relaxed">
                  외부 사전 지식이나 유권 해석을 배제하고, 오직 사용자가 업로드한 문서(PDF, HWPX, TXT)에 실제 적힌 사실만을 추출합니다.
                </p>
              </div>

              <div className="bg-[#F8F7F4] p-3.5 rounded-xl border border-[#E8E4D9] space-y-1.5">
                <p className="font-semibold text-amber-700 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                  2. 없는 내용 자의적 추측 절대 금지
                </p>
                <p className="text-[#7A7463] pl-5 leading-relaxed">
                  문서에 기재되지 않은 사안은 절대 지어내지 않으며, &quot;업로드하신 문서에서는 해당 내용을 찾을 수 없습니다&quot;라고 명확히 표시합니다.
                </p>
              </div>

              <div className="bg-[#F8F7F4] p-3.5 rounded-xl border border-[#E8E4D9] space-y-1.5">
                <p className="font-semibold text-blue-800 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 shrink-0" />
                  3. 출처 및 근거 원문 표시
                </p>
                <p className="text-[#7A7463] pl-5 leading-relaxed">
                  모든 답변은 [파일명 + 조/항/페이지] 출처와 근거 조항 원문 인용구를 함께 명시하여 즉시 교차검증할 수 있습니다.
                </p>
              </div>

              <div className="bg-[#F5F2EA] p-3.5 rounded-xl border border-[#DFD9C9] text-[#5A6F54] text-xs">
                <p className="font-semibold mb-1 text-[#3D473A]">[지원 파일 안내]</p>
                <p>• PDF, TXT, 이미지 파일 및 HWPX(자동 텍스트 추출 지원) 업로드 가능합니다.</p>
                <p>• 구형 HWP 바이너리나 스캔본 문서는 PDF로 변환 후 업로드 시 가장 높은 정확도로 발췌됩니다.</p>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowGuideModal(false)}
                className="bg-[#5A6F54] hover:bg-[#4A5C45] text-white px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer shadow-sm"
              >
                확인하였습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
