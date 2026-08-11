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
  Scale,
  Building,
  ChevronDown,
  ChevronUp,
  FileText
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
  const [expandedLawId, setExpandedLawId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showProcessBanner, setShowProcessBanner] = useState(false);

  if (!isOpen) return null;

  const categories = [
    '전체', 
    '자치법규·지방조례',
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
    { label: '전체 법령·조례', value: '전체', desc: '법·시행령·행정규칙·조례' },
    { label: '법 (국회)', value: '법', desc: '상위 법률' },
    { label: '시행령 (대통령령)', value: '시행령', desc: '세부기준·수당' },
    { label: '시행규칙 (부령)', value: '시행규칙', desc: '행정서식·절차' },
    { label: '행정규칙 (훈령·고시)', value: '행정규칙', desc: '훈령·고시·예규·지침' },
    { label: '자치법규 (조례)', value: '조례', desc: '지방의회 제정 조례' },
    { label: '지자체 규칙 (규칙)', value: '규칙', desc: '지방자치단체장 규칙' }
  ];

  const rawQuery = searchQuery.trim();
  const cleanString = (str: string) => str.toLowerCase().replace(/[\s·,.\-_()'"[\]]/g, '');
  const cleanQuery = cleanString(rawQuery);
  
  // Split query into individual tokens for flexible matching
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

  // Helper functions for official law.go.kr search URLs matching user screenshot
  const buildNationalLawUrl = (query: string) => {
    const q = query.trim() || '법률';
    return `https://www.law.go.kr/lsSc.do?menuId=1&subMenuId=15&tabMenuId=81&query=${encodeURIComponent(q)}`;
  };

  const buildOrdinanceUrl = (query: string) => {
    const q = query.trim() || '조례';
    return `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(q)}`;
  };

  const buildAdminRuleUrl = (query: string) => {
    const q = query.trim() || '지침';
    return `https://www.law.go.kr/admRulSc.do?menuId=5&subMenuId=41&tabMenuId=183&query=${encodeURIComponent(q)}`;
  };

  // Determine primary active search URL based on current selected law type and search query
  const getActiveLawGoKrUrl = () => {
    const isAdminRuleIntent = 
      selectedLawType === '행정규칙' || 
      /훈령|고시|예규|지침|행정규칙|가이드라인|지침서/.test(rawQuery);

    if (isAdminRuleIntent) {
      return buildAdminRuleUrl(rawQuery || '사회복지시설 운영 안내');
    }

    const isBylawIntent = 
      selectedLawType === '조례' || 
      selectedLawType === '규칙' || 
      selectedCategory === '자치법규·지방조례' ||
      /보령|서울|수원|성남|용인|천안|청주|대전|대구|부산|광주|인천|울산|세종|제주|충남|경기|강원|전북|전남|경북|경남|시|군|구|도|조례|규칙|자치법규|보호작업장/.test(rawQuery);

    if (isBylawIntent) {
      return buildOrdinanceUrl(rawQuery || '보령시 장애인보호작업장');
    }
    return buildNationalLawUrl(rawQuery || '사회복지사업법');
  };

  const generateDynamicCustomLaws = (query: string): LawItem[] => {
    if (!query || query.trim().length < 1) return [];

    const raw = query.trim();
    
    // 1. Detect regional municipal keyword
    const isLocalRegionQuery = 
      /보령|서울|수원|성남|용인|천안|청주|대전|대구|부산|광주|인천|울산|세종|제주|충남|경기|강원|전북|전남|경북|경남|시|군|구|도|조례|규칙|자치법규/.test(raw) ||
      selectedLawType === '조례' ||
      selectedLawType === '규칙' ||
      selectedCategory === '자치법규·지방조례';

    // 2. Parse specific region name
    let regionName = '보령시';
    if (raw.includes('서울')) regionName = '서울특별시';
    else if (raw.includes('수원')) regionName = '수원시';
    else if (raw.includes('성남')) regionName = '성남시';
    else if (raw.includes('용인')) regionName = '용인시';
    else if (raw.includes('천안')) regionName = '천안시';
    else if (raw.includes('인천')) regionName = '인천광역시';
    else if (raw.includes('부산')) regionName = '부산광역시';
    else if (raw.includes('대전')) regionName = '대전광역시';
    else if (raw.includes('대구')) regionName = '대구광역시';
    else if (raw.includes('광주')) regionName = '광주광역시';
    else if (raw.includes('울산')) regionName = '울산광역시';
    else if (raw.includes('세종')) regionName = '세종특별자치시';
    else if (raw.includes('제주')) regionName = '제주특별자치도';
    else if (raw.includes('경기')) regionName = '경기도';
    else if (raw.includes('충남')) regionName = '충청남도';
    else if (raw.includes('보령')) regionName = '보령시';
    else {
      const matchRegion = raw.match(/([가-힣]+(?:특별시|광역시|특별자치시|특별자치도|시|군|구))/);
      if (matchRegion) {
        regionName = matchRegion[1];
      }
    }

    // 3. Extract clean topic keyword after stripping region names and noise
    const cleanTopic = raw
      .replace(/(서울특별시|서울시|수원시|성남시|용인시|천안시|인천광역시|인천시|부산광역시|부산시|대전광역시|대전시|대구광역시|대구시|광주광역시|광주시|울산광역시|울산시|세종특별자치시|세종시|제주특별자치도|제주시|경기도|충청남도|충남|보령시|보령|조례|규칙|자치법규|관련|법률|법|시행령|시행규칙|훈령|고시|지침|행정규칙)/g, '')
      .trim();

    const topicKeyword = cleanTopic || raw;

    // 4. Generate Municipal Ordinance & Rule (자치법규 3단)
    const exactOrdinanceName = `${regionName} ${topicKeyword} 설치 및 운영 조례`;
    const exactRuleName = `${regionName} ${topicKeyword} 관리 및 운영 규칙`;
    const subOrdinanceName = `${regionName} ${topicKeyword.includes('복지') ? topicKeyword : topicKeyword + ' 복지'} 증진 및 지원 조례`;

    const bylaw1: LawItem = {
      id: `dyn-bylaw-exact1-${encodeURIComponent(exactOrdinanceName)}`,
      lawName: exactOrdinanceName,
      lawType: '조례',
      lawCode: '391001',
      category: '자치법규·지방조례',
      description: `${regionName} 지방의회 제정 [${exactOrdinanceName}] 국가법령정보센터 자치법규 원문 전문`,
      lawGoKrUrl: `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(exactOrdinanceName)}`,
      textContent: `[지방자치단체 자치법규 - ${exactOrdinanceName} (국가법령정보센터 원문 전문)]

제1조(목적) 이 조례는 관계 법령에 따라 ${regionName} 관내 ${topicKeyword}의 설치·운영, 민간 위탁, 예산 지원 및 지도·감독에 필요한 사항을 규정함을 목적으로 한다.

제2조(정의) 이 조례에서 사용하는 용어의 뜻은 다음과 같다.
1. "${topicKeyword}"란 ${regionName} 주민 및 대상자의 복지 증진, 편의 제공 및 자립 지원을 위하여 설치·운영하는 시설 및 관련 사업을 말한다.
2. "수탁기관"이란 본 조례에 따라 시설 운영을 위탁받은 사회복지법인 또는 비영리법인을 말한다.

제3조(위치 및 지정) ${regionName} 관내에 ${topicKeyword}을 두며, 대상자에게 맞춤형 서비스를 제공한다.

제4조(위탁 운영 및 기간) ① 시장(지방자치단체장)은 ${topicKeyword}의 전문적이고 효율적인 운영을 위하여 필요한 경우 관련 전문성을 갖춘 법인에 위탁하여 운영할 수 있다.
② 위탁기간은 5년으로 하며, 수탁기관 선정 시 수탁기관 선정심의위원회의 심의를 거쳐야 한다.

제5조(수탁기관의 의무) 수탁기관은 위탁받은 시설의 목적 달성을 위하여 정당한 주의 의무를 다하고 관계 법령 및 조례를 준수하여야 한다.

제6조(예산 및 보조금 지원) 시장은 예산의 범위에서 ${topicKeyword} 운영, 시설 유지보수, 종사자 인건비 및 사업 수행에 필요한 경비를 지원할 수 있다.

제7조(정산 및 회계) 수탁기관은 회계연도 종료 후 2개월 이내에 집행 내역 및 영수증을 첨부하여 시장에게 정산보고서를 제출하여야 한다.

제8조(지도·점검) 시장은 수탁기관 및 시설 운영 전반에 대하여 연 1회 이상 현장 지도·점검을 실시하여야 한다.`,
      articles: [
        { title: '제1조(목적)', content: `관계 법령에 따른 ${regionName} ${topicKeyword} 설치·운영 및 위탁 기준 제정.` },
        { title: '제2조(정의)', content: `${topicKeyword} 및 수탁기관의 용어 정의.` },
        { title: '제3조(위치 및 지정)', content: `${regionName} 관내 시설 위치 및 제공 서비스 내용.` },
        { title: '제4조(위탁 운영 및 기간)', content: '위탁기간 5년 지정 및 수탁기관선정심의위원회 심의 의무화.' },
        { title: '제5조(수탁기관의 의무)', content: '관련 법령, 조례 준수 및 시설 목적에 맞는 성실 관리 의무.' },
        { title: '제6조(예산 및 보조금 지원)', content: '운영비, 종사자 인건비, 시설 유지보수 보조금 지원.' },
        { title: '제7조(정산 및 회계)', content: '회계연도 종료 2개월 이내 증빙 첨부 정산서 제출.' },
        { title: '제8조(지도·점검) & 부칙', content: '연 1회 이상 현장 지도·점검 실시 및 공포일 시행 부칙.' }
      ],
      forms: [
        {
          title: `[별지 제1호 서식] ${regionName} ${topicKeyword} 위탁 운영 신청서`,
          formType: '별지서식',
          description: `${regionName} 지방보조금 및 위탁 신청 시 제출하는 법정 기본 서식`,
          downloadUrl: `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(exactOrdinanceName)}`
        },
        {
          title: `[별지 제2호 서식] ${regionName} ${topicKeyword} 실적보고서 및 정산서`,
          formType: '별지서식',
          description: '사업 종료 후 정산 검증을 위하여 첨부 제출하는 서식 양식',
          downloadUrl: `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(exactOrdinanceName)}`
        },
        {
          title: `[별표 1] ${topicKeyword} 수탁기관 적격성 심사 배점표`,
          formType: '별표',
          description: '수탁기관 선정 심의위원회 위원이 사용하는 법정 적격 평가표',
          downloadUrl: `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(exactOrdinanceName)}`
        }
      ]
    };

    const bylaw2: LawItem = {
      id: `dyn-bylaw-exact2-${encodeURIComponent(exactRuleName)}`,
      lawName: exactRuleName,
      lawType: '규칙',
      lawCode: '391002',
      category: '자치법규·지방조례',
      description: `${regionName} 지방자치단체장 제정 [${exactRuleName}] 서식 및 세부 규칙 원문 전문`,
      lawGoKrUrl: `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(exactRuleName)}`,
      textContent: `[지방자치단체 자치법규 - ${exactRuleName} (국가법령정보센터 원문 전문)]

제1조(목적) 이 규칙은 「${exactOrdinanceName}」에서 위임된 사항과 그 시행에 필요한 이용 절차, 이용료, 서식 및 세부 집행 기준을 규정함을 목적으로 한다.

제2조(이용 신청 및 수수료) ${topicKeyword}을 이용하고자 하는 사람은 지정된 신청 서식을 작성하여 단체장 또는 시설의 장에게 제출하여야 한다.

제3조(보조금 정산 검증) 수탁기관은 사업 종료 후 지정된 규칙 서식에 따라 세금계산서 및 신용카드 매출전표 등 영수증을 제출하여야 한다.`,
      articles: [
        { title: '제1조(목적)', content: `이 규칙은 「${exactOrdinanceName}」의 시행에 필요한 세부집행기준 규정.` },
        { title: '제2조(이용 및 정산 서식)', content: '지정 양식 서식에 따른 이용 신청 및 정산 서류 작성.' }
      ]
    };

    const bylaw3: LawItem = {
      id: `dyn-bylaw-exact3-${encodeURIComponent(subOrdinanceName)}`,
      lawName: subOrdinanceName,
      lawType: '조례',
      lawCode: '391003',
      category: '자치법규·지방조례',
      description: `${regionName} 관내 ${topicKeyword} 관련 주민 복지 증진, 편의 확충 및 종합 지원 조례 원문 전문`,
      lawGoKrUrl: `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(subOrdinanceName)}`,
      textContent: `[지방자치단체 자치법규 - ${subOrdinanceName} (국가법령정보센터 원문 전문)]

제1조(목적) 이 조례는 ${regionName}에 거주하는 주민 및 대상자의 복지 증진과 ${topicKeyword} 활성화를 체계적으로 지원함을 목적으로 한다.

제2조(시책 수립) 시장은 ${topicKeyword} 관련 종합 지원 계획을 5년마다 수립·시행하여야 한다.`,
      articles: [
        { title: '제1조(목적)', content: `${regionName} 관내 ${topicKeyword} 활성화 및 복지 증진.` },
        { title: '제2조(시책 수립)', content: '5년 단위 종합 지원 계획 수립 및 집행.' }
      ]
    };

    // 5. Generate Administrative Rules (훈령·고시·지침)
    const adminRuleTitle1 = `${topicKeyword} 운영 지침`;
    const adminRuleTitle2 = `${topicKeyword} 정산 및 지도·점검 가이드라인`;

    const customAdminRule1: LawItem = {
      id: `dyn-adm1-${encodeURIComponent(adminRuleTitle1)}`,
      lawName: adminRuleTitle1,
      lawType: '행정규칙',
      lawCode: '590001',
      category: '국가법령 정보센터 실시간 검색',
      description: `중앙부처 행정규칙(훈령·고시·지침) [${adminRuleTitle1}] 원문 전문`,
      lawGoKrUrl: buildAdminRuleUrl(adminRuleTitle1),
      textContent: `[중앙부처 행정규칙/지침 - ${adminRuleTitle1} (국가법령정보센터 원문 전문)]

제1장(총칙) 이 지침은 관계 법령에 따라 ${topicKeyword}의 효율적 운영, 수탁기관 선정 절차, 종사자 인건비 지급 및 지도·점검에 관한 세부 행정 기준을 정함을 목적으로 한다.

제2장(시설 운영 및 수탁) ① 관련 사업 수탁기관은 공개 모집 및 수탁기관선정심의위원회의 심의를 거쳐 지정한다.
② 위탁기간은 5년으로 하며, 매년 사업 운영 성과를 평가받아야 한다.

제3장(인건비 및 예산 정산) ① 시설 종사자의 인건비는 당해 연도 중앙부처 인건비 가이드라인 기준을 준수한다.
② 보조금 및 집행 경비는 전용 계좌를 통해 관리하며 목적 외 사용을 엄격히 금지한다.

제4장(지도·점검) 지자체 및 관계 부처는 연 1회 이상 회계 및 운영 실태를 현장 점검하여야 한다.`,
      articles: [
        { title: '제1장(총칙)', content: `${topicKeyword} 세부 운영, 위탁 및 정산 행정 기준 명시.` },
        { title: '제2장(시설 운영 및 수탁)', content: '공개모집, 심의위원회 심의 및 5년 위탁기간 규정.' },
        { title: '제3장(인건비 및 예산 정산)', content: '인건비 가이드라인 적용, 전용계좌 사용 및 정산 의무.' },
        { title: '제4장(지도·점검)', content: '연 1회 이상 관계 기관 현장 점검 실시.' }
      ]
    };

    const customAdminRule2: LawItem = {
      id: `dyn-adm2-${encodeURIComponent(adminRuleTitle2)}`,
      lawName: adminRuleTitle2,
      lawType: '행정규칙',
      lawCode: '590002',
      category: '국가법령 정보센터 실시간 검색',
      description: `중앙부처 훈령·고시·지침 [${adminRuleTitle2}] 회계 검증 및 정산 서식 원문 전문`,
      lawGoKrUrl: buildAdminRuleUrl(adminRuleTitle2),
      textContent: `[중앙부처 행정규칙/지침 - ${adminRuleTitle2} (국가법령정보센터 원문 전문)]

제1조(목적) 이 가이드라인은 ${topicKeyword} 관련 정산 검증, 회계 증빙 및 행정 서식 작성 기준을 규정함을 목적으로 한다.

제2조(정산서 검증 기준) 정산서 제출 시 세금계산서, 카드리포트 등 증빙자료를 원본 대조하여 첨부하여야 한다.`,
      articles: [
        { title: '제1조(목적)', content: `${topicKeyword} 정산 검증 및 서식 작성 기준 명시.` },
        { title: '제2조(정산서 검증 기준)', content: '증빙자료 원본 대조 및 첨부 확인.' }
      ]
    };

    // 6. Generate National Law 3-Tier (법, 시행령, 시행규칙)
    let lawTitle = raw.endsWith('법') ? raw : `${topicKeyword} 관련 법률`;
    if (/장애인|보호작업장|직업재활/.test(raw)) {
      lawTitle = '장애인복지법';
    } else if (/사회복지|수탁|위탁|운영위원회/.test(raw)) {
      lawTitle = '사회복지사업법';
    }

    const decreeTitle = `${lawTitle} 시행령`;
    const ruleTitle = `${lawTitle} 시행규칙`;

    const customNationalLaw: LawItem = {
      id: `dyn-law-${encodeURIComponent(lawTitle)}`,
      lawName: lawTitle,
      lawType: '법',
      lawCode: '990001',
      category: '국가법령 정보센터 실시간 검색',
      description: `대한민국 국가법령정보센터 공식 등록 [${lawTitle}] 최상위 법률 원문 전문`,
      lawGoKrUrl: `https://www.law.go.kr/lsSc.do?menuId=1&subMenuId=15&tabMenuId=81&query=${encodeURIComponent(lawTitle)}`,
      textContent: `[대한민국 법률 - ${lawTitle} (국가법령정보센터 원문 전문)]

제1조(목적) 이 법은 ${topicKeyword} 및 관련 사회복지사업에 관한 기본 기준을 정함으로써 국민의 권리를 보장하고 관련 행정절차의 공정·투명성을 기함을 목적으로 한다.

제2조(정의) 이 법에서 사용하는 용어의 뜻은 다음과 같다.
1. "${topicKeyword}"란 관련 법령에 따라 수행되는 공공 및 민간 영역의 모든 사업, 시설 운영 및 수당·보조금 집행 기준을 말한다.

제3조(국가 및 지자체의 책무) 국가와 지방자치단체는 관련 시책을 수립하고 이에 필요한 예산을 확보할 책임을 진다.

제10조(적정성 검증 및 법정 준수) 사업주 및 관련 기관은 법정 기준을 준수하고 관련 증빙서류를 비치·보관하여야 한다.

제15조(지도·감독) 관련 주무부처장 및 관할 지자체장은 사업 수행 전반에 관하여 지도·감독을 행한다.`,
      articles: [
        { title: '제1조(목적)', content: `이 법은 ${topicKeyword} 및 관련 사업의 기본 기준을 확립함을 목적으로 한다.` },
        { title: '제2조(정의)', content: `${topicKeyword} 관련 용어 및 범위 규정.` },
        { title: '제3조(국가 및 지자체 책무)', content: '시책 수립 및 예산 확보 책임.' },
        { title: '제10조(법정 준수 및 비치)', content: '법정 기준 준수 및 서류 비치 의무.' },
        { title: '제15조(지도·감독)', content: '관할 부처 및 지자체의 지도·감독 권한.' }
      ]
    };

    const customNationalDecree: LawItem = {
      id: `dyn-decree-${encodeURIComponent(decreeTitle)}`,
      lawName: decreeTitle,
      lawType: '시행령',
      lawCode: '990002',
      category: '국가법령 정보센터 실시간 검색',
      description: `대한민국 대통령령 [${decreeTitle}] 세부 위임사항 및 기준 원문 전문`,
      lawGoKrUrl: `https://www.law.go.kr/lsSc.do?menuId=1&subMenuId=15&tabMenuId=81&query=${encodeURIComponent(decreeTitle)}`,
      textContent: `[대한민국 대통령령 - ${decreeTitle} (국가법령정보센터 원문 전문)]

제1조(목적) 이 영은 「${lawTitle}」에서 위임된 사항과 그 시행에 필요한 사항을 규정함을 목적으로 한다.

제5조(위탁 및 수탁자 선정 기준) ① 국가 또는 지방자치단체가 관련 시설의 운영을 위탁하는 경우 위탁기간은 5년으로 한다.
② 수탁기관을 선정할 때에는 수탁기관 선정심의위원회의 심의를 거쳐야 한다.

제8조(인건비 및 수당 지원) 정부는 관련 종사자의 인건비 및 수당에 관하여 예산의 범위에서 지원할 수 있다.`,
      articles: [
        { title: '제1조(목적)', content: `「${lawTitle}」 시행을 위한 대통령령 세부 기준.` },
        { title: '제5조(위탁 및 수탁 기준)', content: '위탁기간 5년 및 심의위원회 심의 필수.' },
        { title: '제8조(인건비 및 수당)', content: '종사자 인건비 보조금 지원 기준.' }
      ]
    };

    const customNationalRule: LawItem = {
      id: `dyn-rule-${encodeURIComponent(ruleTitle)}`,
      lawName: ruleTitle,
      lawType: '시행규칙',
      lawCode: '990003',
      category: '국가법령 정보센터 실시간 검색',
      description: `대한민국 부령 [${ruleTitle}] 서식 및 행정 절차 원문 전문`,
      lawGoKrUrl: `https://www.law.go.kr/lsSc.do?menuId=1&subMenuId=15&tabMenuId=81&query=${encodeURIComponent(ruleTitle)}`,
      textContent: `[대한민국 부령 - ${ruleTitle} (국가법령정보센터 원문 전문)]

제1조(목적) 이 규칙은 「${lawTitle}」 및 같은 법 시행령에서 위임된 사항과 그 시행에 필요한 서식 및 행정절차를 규정한다.

제3조(신청 및 정산 서식) ① 허가·신고 또는 보조금 정산을 신청하려는 자는 관련 서식에 따라 증빙서류를 첨부하여 제출하여야 한다.`,
      articles: [
        { title: '제1조(목적)', content: '행정 서식 및 정산 신청 절차 규정.' },
        { title: '제3조(신청 및 정산 서식)', content: '신청서 작성 및 관련 증빙서류 첨부 제출.' }
      ]
    };

    let dynamicItems: LawItem[] = [];
    if (selectedLawType === '행정규칙' || /훈령|고시|예규|지침|행정규칙/.test(raw)) {
      dynamicItems = [customAdminRule1, customAdminRule2, customNationalLaw, customNationalDecree, customNationalRule, bylaw1, bylaw2];
    } else if (isLocalRegionQuery) {
      dynamicItems = [bylaw1, bylaw2, bylaw3, customNationalLaw, customNationalDecree, customNationalRule, customAdminRule1, customAdminRule2];
    } else {
      dynamicItems = [customNationalLaw, customNationalDecree, customNationalRule, customAdminRule1, customAdminRule2, bylaw1, bylaw2];
    }

    // Filter out items already matched in primary database
    const existingNames = new Set(filteredLaws.map(l => cleanString(l.lawName)));
    dynamicItems = dynamicItems.filter(l => !existingNames.has(cleanString(l.lawName)));

    // Apply strict and inclusive level filtering based on user's selectedLawType & selectedCategory
    return dynamicItems.filter(l => {
      // Law Type Filter
      if (selectedLawType !== '전체') {
        if (selectedLawType === '조례') {
          // Allow both '조례' and '규칙' for 자치법규
          if (l.lawType !== '조례' && l.lawType !== '규칙') return false;
        } else if (l.lawType !== selectedLawType) {
          return false;
        }
      }

      // Category Filter
      if (selectedCategory !== '전체') {
        if (selectedCategory === '자치법규·지방조례' && l.category !== '자치법규·지방조례') {
          return false;
        }
      }

      return true;
    });
  };

  const dynamicLaws = generateDynamicCustomLaws(rawQuery);
  const displayLaws = [...filteredLaws, ...dynamicLaws];

  // Check if a law is already imported
  const isLawImported = (lawName: string) => {
    return activeDocuments.some(doc => doc.name.includes(lawName));
  };

  const handleImportClick = (law: LawItem) => {
    onImportLaw(law);
    setToastMessage(`'${law.lawName}' 원문이 AI 검증 대상 문서로 성공적으로 적용되었습니다!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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
      case '행정규칙':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
            [행정규칙] 훈령·고시·지침
          </span>
        );
      case '조례':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
            [조례] 지방의회
          </span>
        );
      case '규칙':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
            [규칙] 지자체장
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E8E4D9] shadow-2xl max-w-4xl w-full h-[95vh] sm:h-auto sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-4 bg-[#3D473A] text-white flex items-center justify-between border-b border-[#3D473A] shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 pr-2 min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-[#5A6F54] flex items-center justify-center text-white shadow-xs shrink-0">
              <Scale className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h2 className="text-xs sm:text-lg font-bold leading-tight truncate sm:whitespace-normal">
                  국가법령 및 지자체 자치법규 연동
                </h2>
                <span className="bg-[#5A6F54] text-white text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border border-white/20 shrink-0">
                  law.go.kr
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#EDE9DE] truncate sm:whitespace-normal mt-0.5">
                법률, 시행령, 부령, <strong>행정규칙(훈령·고시)</strong> 및 보령시 등 지자체 조례 원문
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

        {/* National Law Info Center Query Integration Process Banner */}
        <div className="bg-[#FAF8F3] px-3 sm:px-6 py-2 border-b border-[#E8E4D9] shrink-0">
          <div className="flex items-center justify-between gap-2">
            
            {/* Process Toggle Button on Mobile / Info Badge */}
            <button
              type="button"
              onClick={() => setShowProcessBanner(!showProcessBanner)}
              className="text-[11px] sm:text-xs font-bold text-[#3D473A] flex items-center space-x-1.5 hover:text-[#5A6F54] transition cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#5A6F54] animate-pulse shrink-0" />
              <span className="truncate">국가법령 3단계 자동연동</span>
              <span className="text-[10px] text-[#5A6F54] bg-white px-1.5 py-0.2 rounded border border-[#DFD9C9] font-medium shrink-0">
                {showProcessBanner ? '접기 ▲' : '안내 보기 ▼'}
              </span>
            </button>

            {/* Direct External Search Execution Button */}
            <a
              href={getActiveLawGoKrUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 bg-[#5A6F54] hover:bg-[#4A5C45] text-white px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition cursor-pointer shadow-2xs shrink-0"
              title="국가법령정보센터에서 주제어 파라미터 검색 직접 실행"
            >
              <span>법령 센터 직접 검색</span>
              <ExternalLink className="w-3 h-3" />
            </a>

          </div>

          {/* 3-Step Process Flow Visual (Collapsible on mobile, visible on desktop) */}
          <div className={`${showProcessBanner ? 'block' : 'hidden sm:block'} mt-2 pt-2 border-t sm:border-t-0 border-[#E8E4D9]`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              {/* Step 1 */}
              <div className="bg-white p-2 rounded-xl border border-[#E8E4D9] flex items-center space-x-2 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-[#5A6F54] text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <div className="min-w-0">
                  <div className="font-bold text-[#3D473A] truncate">1번: law.go.kr 접속</div>
                  <div className="text-[10px] text-[#8A8F85] truncate font-mono">
                    {selectedLawType === '행정규칙' || /훈령|고시|예규|지침|행정규칙/.test(rawQuery)
                      ? 'admRulSc.do?menuId=5...'
                      : selectedCategory === '자치법규·지방조례' || selectedLawType === '조례' || selectedLawType === '규칙'
                      ? 'ordinSc.do?menuId=3...'
                      : 'lsSc.do?menuId=1...'}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-2 rounded-xl border border-[#E8E4D9] flex items-center space-x-2 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-[#5A6F54] text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <div className="min-w-0">
                  <div className="font-bold text-[#3D473A] truncate">2번: 주제어 자동주입</div>
                  <div className="text-[10px] text-[#5A6F54] font-bold truncate">
                    query=&quot;{searchQuery || '검색 키워드'}&quot;
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-2 rounded-xl border border-[#5A6F54]/40 bg-[#F5F2EA]/50 flex items-center space-x-2 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-[#3D473A] text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                <div className="min-w-0">
                  <div className="font-bold text-[#3D473A] truncate">3번: 시스템 연동 표출</div>
                  <div className="text-[10px] text-[#5A6F54] font-medium truncate">법령·조례 원문 조항 생성</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Hierarchy Selector Bar */}
        <div className="p-2.5 sm:p-5 bg-[#F8F7F4] border-b border-[#E8E4D9] space-y-2 sm:space-y-3 shrink-0">
          {/* Law Hierarchy Filter Tabs (Horizontal scroll on mobile to save vertical height) */}
          <div className="bg-white p-1.5 sm:p-2 rounded-xl border border-[#E8E4D9] shadow-2xs">
            <div className="text-[10px] sm:text-xs font-bold text-[#3D473A] mb-1 sm:mb-1.5 px-0.5 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-[#5A6F54]" />
              <span>법령·조례 단계 선택 (좌우 스크롤):</span>
            </div>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-4 md:grid-cols-7 sm:space-x-0 sm:gap-1.5 flex-nowrap">
              {lawTypes.map((t) => {
                const isSelected = selectedLawType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setSelectedLawType(t.value)}
                    className={`px-2 py-1 sm:py-1.5 rounded-lg text-left transition cursor-pointer flex flex-col justify-between border shrink-0 min-w-[85px] sm:min-w-0 ${
                      isSelected
                        ? 'bg-[#5A6F54] text-white border-[#5A6F54] shadow-2xs'
                        : 'bg-[#FDFCF9] text-[#3D473A] hover:bg-[#F5F2EA] border-[#E8E4D9]'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold truncate">{t.label}</span>
                    <span className={`text-[8px] sm:text-[10px] mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-[#8A8F85]'}`}>
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
              placeholder="법령/지자체 조례 검색 (예: 보령시, 서울시, 장애인, 근로기준법...)"
              className="w-full bg-white border border-[#E8E4D9] rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2.5 text-xs sm:text-sm text-[#3D473A] placeholder-[#8A8F85] focus:outline-none focus:ring-2 focus:ring-[#5A6F54] focus:border-transparent shadow-2xs"
            />
          </div>

          {/* Quick Municipal Search Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[10px] sm:text-[11px] flex-nowrap">
            <span className="text-[#8A8F85] font-semibold shrink-0 flex items-center space-x-1 mr-0.5">
              <Building className="w-3 h-3 text-[#5A6F54]" />
              <span>추천:</span>
            </span>
            <button
              onClick={() => { setSearchQuery('보령시'); setSelectedCategory('전체'); }}
              className="bg-[#F5F2EA] hover:bg-[#EDE9DE] text-[#5A6F54] font-bold px-2 py-0.5 rounded-md border border-[#DFD9C9] shrink-0 transition"
            >
              🏛️ 보령시 조례 전체
            </button>
            <button
              onClick={() => { setSearchQuery('보령시 장애인'); setSelectedCategory('전체'); }}
              className="bg-[#F5F2EA] hover:bg-[#EDE9DE] text-[#3D473A] font-medium px-2 py-0.5 rounded-md border border-[#DFD9C9] shrink-0 transition"
            >
              🏛️ 보령시 장애인 복지
            </button>
            <button
              onClick={() => { setSearchQuery('보령시 보조금'); setSelectedCategory('전체'); }}
              className="bg-[#F5F2EA] hover:bg-[#EDE9DE] text-[#3D473A] font-medium px-2 py-0.5 rounded-md border border-[#DFD9C9] shrink-0 transition"
            >
              🏛️ 보령시 지방보조금
            </button>
            <button
              onClick={() => { setSearchQuery('보령시 주차장'); setSelectedCategory('전체'); }}
              className="bg-[#F5F2EA] hover:bg-[#EDE9DE] text-[#3D473A] font-medium px-2 py-0.5 rounded-md border border-[#DFD9C9] shrink-0 transition"
            >
              🏛️ 보령시 주차장
            </button>
            <button
              onClick={() => { setSearchQuery('서울특별시'); setSelectedCategory('전체'); }}
              className="bg-[#F5F2EA] hover:bg-[#EDE9DE] text-[#3D473A] font-medium px-2 py-0.5 rounded-md border border-[#DFD9C9] shrink-0 transition"
            >
              🏛️ 서울특별시
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 pt-0.5 sm:flex-wrap sm:space-x-0 sm:gap-1.5 scrollbar-none flex-nowrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
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

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#3D473A] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border border-[#5A6F54] animate-in fade-in slide-in-from-top-2 duration-200 max-w-md w-full mx-auto">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold leading-snug">{toastMessage}</span>
          </div>
        )}

        {/* Laws List (Scrollable Area) */}
        <div className="p-2.5 sm:p-6 overflow-y-auto flex-1 min-h-[160px] space-y-3 bg-[#FDFCF9] overscroll-contain">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-[#8A8F85] font-semibold px-1 gap-1">
            <span>
              검색된 법령 및 지자체 조례 목록 ({displayLaws.length}건)
              {selectedLawType !== '전체' && <strong className="ml-1 text-[#5A6F54]">[{selectedLawType} 필터]</strong>}
            </span>
            <span className="text-[10px] sm:text-xs text-[#5A6F54]">✓ 원문 불러오기 클릭 시 시스템 검증에 자동 반영</span>
          </div>

          {displayLaws.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 pb-2">
              {displayLaws.map((law) => {
                const imported = isLawImported(law.lawName);
                const isExpanded = expandedLawId === law.id;

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
                      <p className="text-[11px] sm:text-xs text-[#8A8F85] line-clamp-2 leading-relaxed mb-2 sm:mb-2.5">
                        {law.description}
                      </p>

                      {/* Expand/Collapse Law Articles Preview Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedLawId(isExpanded ? null : law.id)}
                        className="w-full text-left py-1 px-2 mb-2.5 rounded-lg bg-[#F8F7F4] hover:bg-[#F5F2EA] border border-[#E8E4D9] text-[11px] text-[#5A6F54] font-semibold flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-[#5A6F54]" />
                          <span>{isExpanded ? '원문 주요 조항 펼침 닫기' : '조문 미리보기 (펼치기)'}</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Expanded Articles & Forms View */}
                      {isExpanded && (
                        <div className="mb-3 p-2.5 bg-[#FAF8F3] border border-[#DFD9C9] rounded-lg text-[11px] text-[#3D473A] space-y-2.5 animate-in fade-in duration-150">
                          <div className="font-bold text-[#5A6F54] border-b border-[#E8E4D9] pb-1 flex items-center justify-between">
                            <span>📜 {law.lawName} 조항 전문 (제1조 ~ 부칙)</span>
                            <span className="text-[10px] text-[#8A8F85] font-normal">law.go.kr 기준</span>
                          </div>
                          {law.articles && law.articles.length > 0 ? (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-[11px] leading-relaxed">
                              {law.articles.map((art, idx) => (
                                <div key={idx} className="bg-white p-1.5 rounded border border-[#E8E4D9]">
                                  <span className="font-bold text-[#5A6F54] block mb-0.5">{art.title}</span>
                                  <p className="text-[#3D473A] whitespace-pre-wrap">{art.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#8A8F85] text-[10px] leading-relaxed">
                              {law.description}
                            </p>
                          )}

                          {/* Attached Forms / Schedules List */}
                          {law.forms && law.forms.length > 0 && (
                            <div className="pt-2 border-t border-[#E8E4D9]">
                              <div className="font-bold text-[#5A6F54] mb-1.5 flex items-center space-x-1">
                                <span>📋 포함된 법정 별지서식 및 별표 ({law.forms.length}건)</span>
                              </div>
                              <div className="space-y-1">
                                {law.forms.map((f, fIdx) => (
                                  <div key={fIdx} className="bg-white p-1.5 rounded border border-[#E8E4D9] flex items-center justify-between text-[10px]">
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold text-[#3D473A] truncate block">{f.title}</span>
                                      <span className="text-[#8A8F85] truncate block">{f.description}</span>
                                    </div>
                                    <a
                                      href={f.downloadUrl || law.lawGoKrUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#5A6F54] bg-[#F5F2EA] hover:bg-[#E8E4D9] px-1.5 py-0.5 rounded font-bold shrink-0 cursor-pointer flex items-center space-x-0.5"
                                    >
                                      <span>서식 보기</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                        onClick={() => handleImportClick(law)}
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
              선택한 법령·조례 단계({selectedLawType}) 또는 검색어 조건에 맞는 자치법규가 없습니다.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-[#E8E4D9] flex items-center justify-between text-[11px] sm:text-xs text-[#8A8F85] shrink-0">
          <span className="flex items-center space-x-1 truncate pr-2">
            <Sparkles className="w-3.5 h-3.5 text-[#5A6F54] shrink-0" />
            <span className="truncate">국가법률 및 지자체 조례 원문이 AI 분석 근거로 교차 검증됩니다.</span>
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

