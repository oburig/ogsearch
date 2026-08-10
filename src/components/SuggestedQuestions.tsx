import React from 'react';
import { HelpCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

const SAMPLE_QUESTIONS = [
  '연차유급휴가 및 특별재활휴가 부여 기준 조항 발췌',
  '근로기준법상 1주 근로시간, 휴게시간 및 가산수당 비율',
  '중증장애인생산품 우선구매 특별법 수의계약 및 100분의 1 목표비율',
  '작업복, 안전화 등 피복 및 보호장구 무상 지급 주기',
  '야간근무 및 휴일근로 시 수당 가산 비율 및 일반 상식 조언',
  '중증장애인 생산품 품질 검수 기준 및 하자보수 기간',
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#8A8F85] mb-2">
        <HelpCircle className="w-3.5 h-3.5 text-[#5A6F54]" />
        <span>빠른 규정 발췌 질문 예시</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            disabled={disabled}
            className="text-xs bg-[#F5F2EA] hover:bg-[#5A6F54] text-[#3D473A] hover:text-white border border-[#E8E4D9] hover:border-[#5A6F54] px-3 py-1.5 rounded-full font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
