import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  FilePlus, 
  CheckSquare, 
  Square, 
  Eye, 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  FileCheck,
  Building2
} from 'lucide-react';
import { DocumentFile } from '../types';
import { extractTextFromHwpx, fileToBase64, fileToText } from '../utils/documentExtractor';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';

interface DocumentUploaderProps {
  documents: DocumentFile[];
  onAddDocument: (doc: DocumentFile) => void;
  onRemoveDocument: (id: string) => void;
  onToggleDocument: (id: string) => void;
  onPreviewDocument: (doc: DocumentFile) => void;
  onLoadSamples: () => void;
  onOpenLawModal: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  onAddDocument,
  onRemoveDocument,
  onToggleDocument,
  onPreviewDocument,
  onLoadSamples,
  onOpenLawModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNameLower = file.name.toLowerCase();
      setProcessingStatus(`문서 읽는 중... (${i + 1}/${files.length}): ${file.name}`);

      try {
        let type: DocumentFile['type'] = 'txt';
        let dataBase64: string | undefined;
        let textContent: string | undefined;
        let note: string | undefined;

        if (fileNameLower.endsWith('.pdf')) {
          type = 'pdf';
          dataBase64 = await fileToBase64(file);
          note = 'PDF 문서 (Gemini 멀티모달 시각/텍스트 인식)';
        } else if (fileNameLower.endsWith('.hwpx')) {
          type = 'hwpx';
          setProcessingStatus(`HWPX 텍스트 추출 중... ${file.name}`);
          textContent = await extractTextFromHwpx(file);
          note = 'HWPX 자동 텍스트 발췌 완료';
        } else if (fileNameLower.endsWith('.hwp')) {
          type = 'hwpx';
          // Old binary HWP warning text
          textContent = `[구형 HWP 파일입니다. HWPX 또는 PDF로 변환하여 업로드하시면 가장 정교하게 인식됩니다.]`;
          note = '구형 HWP (PDF 변환 권장)';
        } else if (fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.md')) {
          type = 'txt';
          textContent = await fileToText(file);
          note = '텍스트 문서';
        } else if (file.type.startsWith('image/')) {
          type = 'image';
          dataBase64 = await fileToBase64(file);
          note = '이미지 규정문서 (OCR 문맥 인식)';
        } else {
          // Default text or base64
          type = 'txt';
          textContent = await fileToText(file);
        }

        const newDoc: DocumentFile = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          type,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          dataBase64,
          textContent,
          enabled: true,
          uploadedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          note
        };

        onAddDocument(newDoc);
      } catch (error) {
        console.error('File reading error:', error);
        alert(`파일 "${file.name}" 처리 중 오류가 발생했습니다.`);
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const activeCount = documents.filter(d => d.enabled).length;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-xs mb-4 overflow-hidden transition-all">
      {/* Accordion Bar Header */}
      <div 
        className="p-3 sm:px-4 sm:py-3 bg-[#FBFBFA] border-b border-[#E8E4D9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-[#F5F2EA]/80 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center space-x-2 min-w-0 pr-1">
            <FileCheck className="w-5 h-5 text-[#5A6F54] shrink-0" />
            <h2 className="font-bold text-[#3D473A] text-sm sm:text-base leading-tight">
              조회 및 발췌 대상 문서 관리 ({documents.length}건)
            </h2>
            {activeCount > 0 && (
              <span className="bg-[#F5F2EA] text-[#5A6F54] text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border border-[#DFD9C9] shrink-0 whitespace-nowrap">
                {activeCount}건 적용 중
              </span>
            )}
          </div>

          <button className="text-[#8A8F85] hover:text-[#3D473A] p-1 sm:hidden shrink-0">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#E8E4D9]/60">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLawModal();
              }}
              className="text-xs bg-[#5A6F54] hover:bg-[#4A5C45] text-white px-2.5 py-1.5 sm:py-1 rounded-lg font-semibold transition flex items-center space-x-1 cursor-pointer shadow-2xs whitespace-nowrap"
              title="대한민국 국가법령정보센터(law.go.kr) 검색 및 법률 불러오기"
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>국가법령 연동 (law.go.kr)</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSamples();
              }}
              className="text-xs bg-[#F5F2EA] text-[#5A6F54] hover:bg-[#EDE9DE] border border-[#DFD9C9] px-2.5 py-1.5 sm:py-1 rounded-lg font-semibold transition flex items-center space-x-1 cursor-pointer whitespace-nowrap"
              title="장애인직업재활시설 샘플 규정문서 불러오기"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5A6F54] shrink-0" />
              <span>샘플 규정</span>
            </button>
          </div>

          <button className="text-[#8A8F85] hover:text-[#3D473A] p-1 hidden sm:block shrink-0">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center relative ${
              isDragging
                ? 'border-[#5A6F54] bg-[#F5F2EA]'
                : 'border-[#E8E4D9] hover:border-[#5A6F54] bg-[#F8F7F4] hover:bg-[#F5F2EA]/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              multiple
              accept=".pdf,.hwpx,.hwp,.txt,.csv,.md,.png,.jpg,.jpeg"
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center py-2 text-[#5A6F54]">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm font-semibold">{processingStatus}</p>
                <p className="text-xs text-[#8A8F85] mt-1">문서 파싱 및 발췌 준비를 진행하고 있습니다.</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#5A6F54] text-white flex items-center justify-center mb-2 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#3D473A]">
                  클릭하거나 파일(PDF, HWPX, TXT)을 이곳으로 드래그하여 업로드하세요
                </p>
                <p className="text-xs text-[#8A8F85] mt-1">
                  PDF, HWPX(텍스트 자동 추출), TXT 문서 및 스캔본 이미지 지원 (여러 파일 동시 선택 가능)
                </p>
              </>
            )}
          </div>

          {/* HWPX / HWP notice bar */}
          <div className="bg-[#F5F2EA] text-[#3D473A] px-3.5 py-2.5 rounded-xl text-xs border border-[#E8E4D9] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-[#5A6F54] shrink-0 mt-0.5" />
            <span>
              <strong>문서 형식 안내:</strong> HWPX 파일은 텍스트가 자동 추출됩니다. 스캔본 이미지나 구형 .hwp 파일은 PDF로 변환하여 업로드하시면 더욱 높은 정확도로 사실이 발췌됩니다.
            </span>
          </div>

          {/* Uploaded Documents List */}
          {documents.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8A8F85] font-semibold px-1">
                <span>등록된 문서 목록 ({documents.length}개)</span>
                <span>클릭하여 검색 포함 여부 토글</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      doc.enabled
                        ? 'bg-white border-[#E8E4D9] shadow-2xs text-[#3D473A]'
                        : 'bg-[#F8F7F4] border-[#EDE9DE] text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                      <button
                        onClick={() => onToggleDocument(doc.id)}
                        className="text-slate-500 hover:text-[#5A6F54] transition shrink-0 cursor-pointer"
                        title={doc.enabled ? '검색 대상 제외' : '검색 대상 포함'}
                      >
                        {doc.enabled ? (
                          <CheckSquare className="w-5 h-5 text-[#5A6F54]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0 ${
                          doc.type === 'pdf' ? 'bg-red-50 text-red-700 border border-red-200' :
                          doc.type === 'hwpx' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-[#F5F2EA] text-[#5A6F54]'
                        }`}>
                          {doc.type}
                        </span>

                        <span className={`text-xs sm:text-sm font-semibold truncate ${doc.enabled ? 'text-[#3D473A]' : 'text-slate-400 line-through'}`}>
                          {doc.name}
                        </span>

                        <span className="text-[11px] text-[#8A8F85] shrink-0 hidden sm:inline">
                          ({formatFileSize(doc.size)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        onClick={() => onPreviewDocument(doc)}
                        className="p-1.5 text-[#8A8F85] hover:text-[#3D473A] hover:bg-[#F5F2EA] rounded-lg transition cursor-pointer"
                        title="문서 본문/파싱 내용 미리보기"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="문서 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-[#8A8F85] border border-dashed border-[#E8E4D9] rounded-xl bg-[#FBFBFA]">
              현재 업로드된 규정 문서가 없습니다. 샘플 규정을 불러오거나 내부 지침 PDF/HWPX를 업로드해 보세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
