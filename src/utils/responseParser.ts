export interface ParsedResponse {
  answerFacts: string[];
  quotes: { text: string; source?: string }[];
  sources: string[];
  unconfirmed: string[];
  generalAdvice: string[];
  isNotFound: boolean;
  rawText: string;
}

export function parseResponseText(text: string): ParsedResponse {
  const containsAdvice = text.includes('💡') || text.includes('[일반 상식');
  const containsNotFoundText = text.includes('업로드하신 문서에서는 해당 내용을 찾을 수 없습니다') ||
                                text.includes('업로드된 문서에서 해당 내용을 찾을 수 없습니다');
  
  // Only mark as strictly pure "not found" box if there is no general advice section included
  const isNotFound = containsNotFoundText && !containsAdvice;

  const result: ParsedResponse = {
    answerFacts: [],
    quotes: [],
    sources: [],
    unconfirmed: [],
    generalAdvice: [],
    isNotFound,
    rawText: text,
  };

  if (isNotFound) {
    return result;
  }

  // Parse sections based on markers
  const section1Match = text.match(/(?:1\.\s*)?📌?\s*\[발췌 답변\]([\s\S]*?)(?=(?:2\.\s*)?📜|(?:3\.\s*)?🏷️|(?:4\.\s*)?⚠️|(?:5\.\s*)?💡|\[근거 원문|\[출처|\[미확인|\[일반 상식|$)/i);
  const section2Match = text.match(/(?:2\.\s*)?📜?\s*\[근거 원문 인용\]([\s\S]*?)(?=(?:3\.\s*)?🏷️|(?:4\.\s*)?⚠️|(?:5\.\s*)?💡|\[출처|\[미확인|\[일반 상식|$)/i);
  const section3Match = text.match(/(?:3\.\s*)?🏷️?\s*\[출처\]([\s\S]*?)(?=(?:4\.\s*)?⚠️|(?:5\.\s*)?💡|\[미확인|\[일반 상식|$)/i);
  const section4Match = text.match(/(?:4\.\s*)?⚠️?\s*\[미확인 내용\]([\s\S]*?)(?=(?:5\.\s*)?💡|\[일반 상식|$)/i);
  const section5Match = text.match(/(?:5\.\s*)?💡?\s*\[일반 상식(?:\s*및\s*실무 조언)?(?:\s*\(문서 외 참고 정보\))?\]([\s\S]*?)$/i);

  if (section1Match && section1Match[1]) {
    const lines = section1Match[1]
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    result.answerFacts = lines;
  }

  if (section2Match && section2Match[1]) {
    const rawQuotes = section2Match[1].trim();
    // Extract quotes inside ""
    const quoteMatches = rawQuotes.match(/"([^"]+)"/g);
    if (quoteMatches && quoteMatches.length > 0) {
      result.quotes = quoteMatches.map(q => ({ text: q.replace(/^"|"$/g, '') }));
    } else {
      result.quotes = [{ text: rawQuotes.replace(/^[-*•]\s*/, '') }];
    }
  }

  if (section3Match && section3Match[1]) {
    const lines = section3Match[1]
      .trim()
      .split('\n')
      .map(l => l.replace(/^[-*•]\s*/, '').trim())
      .filter(l => l.length > 0);
    result.sources = lines;
  }

  if (section4Match && section4Match[1]) {
    const unconf = section4Match[1].trim();
    if (unconf && !unconf.includes('해당 없음') && !unconf.includes('없음')) {
      result.unconfirmed = [unconf];
    }
  }

  if (section5Match && section5Match[1]) {
    const adviceLines = section5Match[1]
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    result.generalAdvice = adviceLines;
  }

  return result;
}
