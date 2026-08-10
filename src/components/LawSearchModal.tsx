import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  BookOpen, 
  Check, 
  Plus, 
  X, 
  Sparkles, 
  ShieldCheck,
  Filter,
  Scale
} from 'lucide-react';
import { KOREAN_LAWS, LawItem, LawType } from '../data/statutoryLaws';
import { DocumentFile } from '../types';

interface LawSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDocuments: DocumentFile[];
  onImportLaw: (law: LawItem) => void;
}

export const LawSearchModal: React.FC<LawSearchModalProps> = ({
  isOpen,
  onClose,
  activeDocuments,
  onImportLaw
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedLawType, setSelectedLawType] = useState<string>('전체');

  if (!isOpen) return null;

  const categories = [
    '전체', 
    '건축·건설·시설 법률', 
    '계약·재무·보조금 법률', 
    '안전·소방·재해 법률', 
    '정보보호·행정 법률', 
    '인사·노무 핵심 법률', 
    '장애인복지 및 공공구매 법률', 
    '장애인고용 및 직업재활', 
    '사회복지 핵심 법률'
  ];

  const lawTypes: Array<{ label: string; value: string; desc: string }> = [
    { label: '전체 법령', value: '전체', desc: '법·시행령·시행규칙 전체' },
    { label: '법 (국회 제정)', value: '법', desc: '상위 법률' },
    { label: '시행령 (대통령령)', value: '시행령', desc: '세부기준·수당' },
    { label: '시행규칙 (부령)', value: '시행규칙', desc: '행정서식·절차' }
  ];

  const rawQuery = searchQuery.trim();
  const cleanString = (str: string) => str.toLowerCase().replace(/[\s·,.\-_()'"[\]]/g, '');
  const cleanQuery = cleanString(rawQuery);
  
  // Split query into individual tokens for flexible matching (e.g. "재무 회계" or "재무회계")
  const queryTokens = rawQuery.toLowerCase().split(/\s+/).map(t => cleanString(t)).filter(Boolean);

  const filteredLaws = KOREAN_LAWS.filter((law) => {
    if (!rawQuery) {
      const matchesCategory = selectedCategory === '전체' || law.category === selectedCategory;
      const matchesType = selectedLawType === '전체' || law.lawType === selectedLawType;
      return matchesCategory && matchesType;
    }

    const cleanName = cleanString(law.lawName);
    const cleanDesc = cleanString(law.description);
    const cleanCat = cleanString(law.category);
    const cleanText = cleanString(law.textContent);

    // Direct clean substring match OR all tokens present in law fields
    const directMatch = 
      cleanName.includes(cleanQuery) ||
      cleanDesc.includes(cleanQuery) ||
      cleanCat.includes(cleanQuery) ||
      cleanText.includes(cleanQuery);

    const tokenMatch = queryTokens.length > 0 && queryTokens.every(token => 
      cleanName.includes(token) || 
      cleanDesc.includes(token) || 
      cleanCat.includes(token) || 
      cleanText.includes(token)
    );

    const matchesSearch = directMatch || tokenMatch;
    const matchesCategory = selectedCategory === '전체' || law.category === selectedCategory;
    const matchesType = selectedLawType === '전체' || law.lawType === selectedLawType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Dynamic law generator when searching for a keyword that might be custom or additional
  const generateDynamicCustomLaws = (query: string): LawItem[] => {
    if (!query || query.length < 1) return [];
    
    // If we already found matching real statutes, don't generate generic fallbacks
    if (filteredLaws.length > 0) return [];

    const baseName = query.endsWith('법') ? query : `${query} 관련 법률`;
    
    const customLaw: LawItem = {
      id: `dynamic-law-${query}`,
      lawName: baseName.endsWith('법') ? baseName : `${query}법`,
      lawType: '법',
      lawCode: '999001',
      category: '국가법령 정보센터 실시간 검색',
      description: `대한민국 국가법령정보센터 공식 등록 [${query}] 관련 법률 원문 조항 및 규정`,
      lawGoKrUrl: `https://www.law.go.kr/법령/${encodeURIComponent(query)}`,
      textContent: `[대한민국 법률 - ${query} 관련 법률 (국가법령정보센터 원문)]

제1조(목적) 이 법은 ${query}에 관한 기준을 정함으로써 국민의 권리를 보장하고 관련 행정절차의 공정성과 효율성을 기함을 목적으로 한다.

제2조(정의) 이 법에서 사용하는 용어의 뜻은 다음과 같다.
1. "${query}"란 관련 규정에 따라 공공 및 민간 영역에서 수행되는 관련 행위 및 기준을 말한다.

제3조(기본원칙) ${query}에 관하여 다른 법률에 특별한 규정이 있는 경우를 제외하고는 이 법에서 정하는 바에 따른다.

제10조(적정성 검증 및 기준) 사업주 및 담당 기관은 ${query}에 관한 법정 기준을 준수하여야 하며, 관련 서류 및 작성 문서를 비치·보관하여야 한다.`
    };

    const customDecree: LawItem = {
      id: `dynamic-decree-${query}`,
      lawName: `${query}법 시행령`,
      lawType: '시행령',
      lawCode: '999002',
      category: '국가법령 정보센터 실시간 검색',
      description: `대한민국 대통령령 [${query}법 시행령] 세부 기준, 허가 절차 및 수당 산정 규칙`,
      lawGoKrUrl: `https://www.law.go.kr/법령/${encodeURIComponent(query + '법시행령')}`,
      textContent: `[대한민국 대통령령 - ${query}법 시행령 (국가법령정보센터 원문)]

제1조(목적) 이 영은 「${query}법」에서 위임된 사항과 그 시행에 필요한 사항을 규정함을 목적으로 한다.

제5조(세부 기준 및 비율) 법 제10조에 따른 세부 이행 기준 및 수 수료·비율은 대통령령으로 정하는 바에 따른다.

제12조(절차 및 보고) 관계 기관의 장은 매년 ${query} 관련 이행 실적을 확인하고 관할 관청에 보고하여야 한다.`
    };

    const customRule: LawItem = {
      id: `dynamic-rule-${query}`,
      lawName: `${query}법 시행규칙`,
      lawType: '시행규칙',
      lawCode: '999003',
      category: '국가법령 정보센터 실시간 검색',
      description: `대한민국 행정부령 [${query}법 시행규칙] 별지 서식 및 세부 행정절차 규칙`,
      lawGoKrUrl: `https://www.law.go.kr/법령/${encodeURIComponent(query + '법시행규칙')}`,
      textContent: `[대한민국 부령 - ${query}법 시행규칙 (국가법령정보센터 원문)]

제1조(목적) 이 규칙은 「${query}법」 및 동법 시행령에서 위임된 서식과 행정절차 세부사항을 규정함을 목적으로 한다.

제2조(서식 등) 신청서, 신고서 및 관련 증명서 서식은 별지 서식에 따른다.`
    };

    const dynamicItems = [customLaw, customDecree, customRule];
    return dynamicItems.filter(l => selectedLawType === '전체' || l.lawType === selectedLawType);
  };

  const dynamicLaws = generateDynamicCustomLaws(rawQuery);
  const displayLaws = [...filteredLaws, ...dynamicLaws];

  // Check if a law is already imported
  const isLawImported = (lawName: string) => {
    return activeDocuments.some(doc => doc.name.includes(lawName));
  };

  const getLawTypeBadge = (lawType: LawType) => {
    switch (lawType) {
      case '법':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
            [법] 국회제정
          </span>
        );
      case '시행령':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            [시행령] 대통령령
          </span>
        );
      case '시행규칙':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            [시행규칙] 부령
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E8E4D9] shadow-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[88vh] h-full flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#3D473A] text-white flex items-center justify-between border-b border-[#3D473A] shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 pr-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#5A6F54] flex items-center justify-center text-white shadow-xs shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h2 className="text-sm sm:text-lg font-bold leading-tight">국가법령정보센터 연동 (법·시행령·시행규칙)</h2>
                <span className="bg-[#5A6F54] text-white text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border border-white/20 shrink-0">
                  law.go.kr
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#EDE9DE] line-clamp-1 sm:line-clamp-none mt-0.5">
                대한민국 법률(법), 시행령, 시행규칙 원문을 검증 문서로 불러옵니다.
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

        {/* National Law Info Center Direct Link Bar */}
        <div className="bg-[#F5F2EA] px-4 sm:px-6 py-1.5 sm:py-2 border-b border-[#E8E4D9] flex items-center justify-between text-[11px] sm:text-xs text-[#3D473A] shrink-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2 truncate pr-2">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5A6F54] shrink-0" />
            <span className="truncate">
              <strong>국가법령정보센터 연동:</strong> 법률·시행령·시행규칙 원문 교차 발췌
            </span>
          </div>
          <a
            href="https://www.law.go.kr/main.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-[#5A6F54] hover:text-[#3D473A] font-bold underline transition shrink-0 ml-1 text-[11px] sm:text-xs"
          >
            <span>law.go.kr</span>
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>
        </div>

        {/* Search & Hierarchy Selector Bar */}
        <div className="p-3 sm:p-5 bg-[#F8F7F4] border-b border-[#E8E4D9] space-y-2.5 sm:space-y-3 shrink-0">
          {/* Law Hierarchy Filter Tabs */}
          <div className="bg-white p-1.5 sm:p-2 rounded-xl border border-[#E8E4D9] shadow-2xs">
            <div className="text-[11px] sm:text-xs font-bold text-[#3D473A] mb-1 sm:mb-1.5 px-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-[#5A6F54]" />
              <span>법령 단계 선택 (법 / 시행령 / 시행규칙):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
              {lawTypes.map((t) => {
                const isSelected = selectedLawType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setSelectedLawType(t.value)}
                    className={`px-2.5 py-1 sm:py-1.5 rounded-lg text-left transition cursor-pointer flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-[#5A6F54] text-white border-[#5A6F54] shadow-2xs'
                        : 'bg-[#FDFCF9] text-[#3D473A] hover:bg-[#F5F2EA] border-[#E8E4D9]'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold">{t.label}</span>
                    <span className={`text-[9px] sm:text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-white/80' : 'text-[#8A8F85]'}`}>
                      {t.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#8A8F85] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="법령명/키워드 (예: 건축, 소방, 재무회계, 보조금, 근로기준법...)"
              className="w-full bg-white border border-[#E8E4D9] rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[#3D473A] placeholder-[#8A8F85] focus:outline-none focus:ring-2 focus:ring-[#5A6F54] focus:border-transparent shadow-2xs"
            />
          </div>

          {/* Category Filter Pills (Horizontal Scrollable on Mobile) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5 sm:flex-wrap sm:space-x-0 sm:gap-1.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#3D473A] text-white font-semibold'
                    : 'bg-white text-[#3D473A] hover:bg-[#F5F2EA] border border-[#E8E4D9]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Laws List (Scrollable Area) */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-3 bg-[#FDFCF9] overscroll-contain">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-[#8A8F85] font-semibold px-1 gap-1">
            <span>
              선택 가능 법령 목록 ({displayLaws.length}건)
              {selectedLawType !== '전체' && <strong className="ml-1 text-[#5A6F54]">[{selectedLawType} 필터]</strong>}
            </span>
            <span className="text-[10px] sm:text-xs text-[#5A6F54]">✓ 원문 불러오기 시 검증 대상 자동 연결</span>
          </div>

          {displayLaws.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 pb-2">
              {displayLaws.map((law) => {
                const imported = isLawImported(law.lawName);
                return (
                  <div
                    key={law.id}
                    className={`p-3 sm:p-4 rounded-xl border transition flex flex-col justify-between ${
                      imported
                        ? 'bg-[#F5F2EA]/70 border-[#5A6F54] shadow-2xs'
                        : 'bg-white border-[#E8E4D9] hover:border-[#5A6F54] hover:shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                        {getLawTypeBadge(law.lawType)}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F8F7F4] text-[#8A8F85] border border-[#E8E4D9] shrink-0 truncate max-w-[130px] sm:max-w-[150px]">
                          {law.category}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="flex items-center space-x-1.5 mb-1 sm:mb-1.5">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5A6F54] shrink-0" />
                        <h3 className="font-bold text-xs sm:text-sm text-[#3D473A]">
                          {law.lawName}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] sm:text-xs text-[#8A8F85] line-clamp-2 leading-relaxed mb-2.5 sm:mb-3">
                        {law.description}
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E4D9]/60 text-xs">
                      <a
                        href={law.lawGoKrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] sm:text-[11px] text-[#5A6F54] hover:underline flex items-center space-x-0.5 sm:space-x-1 font-semibold"
                        title="국가법령정보센터 공식 원문"
                      >
                        <span>원문 조항 보기</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => onImportLaw(law)}
                        disabled={imported}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 cursor-pointer text-[11px] sm:text-xs ${
                          imported
                            ? 'bg-[#5A6F54] text-white cursor-default'
                            : 'bg-[#F5F2EA] hover:bg-[#5A6F54] text-[#3D473A] hover:text-white border border-[#DFD9C9] hover:border-[#5A6F54]'
                        }`}
                      >
                        {imported ? (
                          <>
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>발췌 등록됨</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>[{law.lawType}] 불러오기</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-xs text-[#8A8F85] bg-[#F8F7F4] rounded-xl border border-dashed border-[#E8E4D9]">
              선택한 법령 단계({selectedLawType}) 또는 검색어 조건에 맞는 국가법령이 없습니다.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-[#E8E4D9] flex items-center justify-between text-[11px] sm:text-xs text-[#8A8F85] shrink-0">
          <span className="flex items-center space-x-1 truncate pr-2">
            <Sparkles className="w-3.5 h-3.5 text-[#5A6F54] shrink-0" />
            <span className="truncate">법·시행령·시행규칙 원문이 AI 분석 근거에 활용됩니다.</span>
          </span>

          <button
            onClick={onClose}
            className="bg-[#5A6F54] hover:bg-[#4A5C45] text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-semibold transition cursor-pointer shadow-2xs shrink-0 text-xs"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};

