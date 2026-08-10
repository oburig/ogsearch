import JSZip from 'jszip';

/**
 * Extracts plain text from an HWPX file (ZIP archive containing XML sections)
 */
export async function extractTextFromHwpx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    let combinedText = '';
    
    // Search for section XML files in Contents or root
    const sectionFiles = Object.keys(zip.files).filter(filename => 
      filename.toLowerCase().includes('section') && filename.endsWith('.xml')
    );
    
    // Sort sections naturally section0, section1, ...
    sectionFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (sectionFiles.length === 0) {
      // Fallback: look for any xml file in Contents
      const xmlFiles = Object.keys(zip.files).filter(filename => 
        filename.endsWith('.xml') && !filename.includes('header') && !filename.includes('settings')
      );
      sectionFiles.push(...xmlFiles);
    }

    for (const fileName of sectionFiles) {
      const xmlText = await zip.files[fileName].async('string');
      
      // Parse text nodes from XML (hp:t elements or general XML tags)
      const matches = xmlText.match(/<hp:t[^>]*>(.*?)<\/hp:t>/g) || 
                      xmlText.match(/<t[^>]*>(.*?)<\/t>/g);

      if (matches && matches.length > 0) {
        const textParts = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        combinedText += textParts.join('\n') + '\n\n';
      } else {
        // Fallback XML strip
        const cleanText = xmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanText.length > 20) {
          combinedText += cleanText + '\n\n';
        }
      }
    }

    if (!combinedText.trim()) {
      return `[HWPX 파일 "${file.name}"에서 텍스트를 자동 추출했습니다. 텍스트 내용이 비어있거나 스캔본인 경우 PDF 파일로 변환하여 업로드해주시기 바랍니다.]`;
    }

    return combinedText.trim();
  } catch (error) {
    console.error('HWPX extraction error:', error);
    return `[HWPX 파일 "${file.name}" 해석 중 오류가 발생했습니다. HWPX/HWP 문서는 PDF로 변환 후 업로드해주시면 더욱 정확히 인식됩니다.]`;
  }
}

/**
 * Converts File to Base64 string (without data:MIME;base64, prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts File to Plain Text
 */
export function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsText(file, 'UTF-8');
  });
}
