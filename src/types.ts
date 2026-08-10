export interface DocumentFile {
  id: string;
  name: string;
  type: 'pdf' | 'hwpx' | 'txt' | 'image';
  size: number;
  mimeType: string;
  dataBase64?: string; // For binary files (PDF, image)
  textContent?: string; // For text-extracted files (HWPX, TXT)
  enabled: boolean;
  uploadedAt: string;
  pageCount?: number;
  note?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: {
    docName: string;
    location?: string;
    quote?: string;
  }[];
  unconfirmedParts?: string[];
  isNotFound?: boolean;
  documentsUsed?: string[];
  isLoading?: boolean;
  error?: string;
}

export interface AskQuestionRequest {
  question: string;
  documents: {
    id: string;
    name: string;
    type: string;
    mimeType: string;
    dataBase64?: string;
    textContent?: string;
  }[];
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AskQuestionResponse {
  answer: string;
  rawText: string;
  isNotFound: boolean;
}
