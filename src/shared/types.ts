export type ISODateString = string; // YYYY-MM-DDTHH:mm:ss.sssZ

export type Status = 'to_read' | 'in_review' | 'annotated' | 'archived';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  source?:
    | 'url'
    | 'arxiv'
    | 'pubmed'
    | 'crossref'
    | 'semanticscholar'
    | 'ieee'
    | 'sciencedirect'
    | 'jstor'
    | 'googlescholar'
    | 'pdf'
    | 'openalex'
    | 'clinicaltrials';
  abstract?: string;
  status: Status;
  filePath?: string; // absolute path to stored PDF
  textHash: string; // sha256 of extracted text
  addedAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AnnotationAnchor {
  textQuote?: { exact: string; prefix?: string; suffix?: string };
  region?: { page: number; x: number; y: number; width: number; height: number };
}

export interface Annotation {
  id: string;
  paperId: string;
  page?: number;
  color: string;
  note?: string;
  tags: string[];
  anchors: AnnotationAnchor;
  createdAt: ISODateString;
}

// Academic Database Integration Types
export interface AcademicPaper {
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  abstract?: string;
  url?: string;
  citations?: number;
  source:
    | 'googlescholar'
    | 'semanticscholar'
    | 'pubmed'
    | 'ieee'
    | 'url'
    | 'arxiv'
    | 'crossref'
    | 'sciencedirect'
    | 'jstor'
    | 'pdf'
    | 'openalex'
    | 'clinicaltrials';
}

export interface AcademicSearchResult {
  papers: AcademicPaper[];
  totalResults: number;
  searchTime: number;
}

// Extraction & Reporting Types
export type ExtractionColumnType = 'text' | 'number' | 'boolean' | 'date' | 'categorical';

export type ExtractionModel = 'qwen3-0.6b' | 'qwen3-1.7b' | 'phi-4-mini';

export interface ExtractionColumn {
  id: string;
  name: string; // column display name
  type: ExtractionColumnType;
  prompt: string; // instruction for AI extraction
  options?: string[]; // allowed values for categorical
  model?: ExtractionModel; // preferred AI model for extraction
  isVisible?: boolean; // column visibility in table
  order?: number; // column display order
}

export interface ExtractionTemplate {
  id: string;
  name: string;
  columns: ExtractionColumn[];
  createdAt: ISODateString;
}

export type ExtractedCellValue = string | number | boolean | null;

export interface TextQuote {
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface CellProvenance {
  quote?: TextQuote;
  page?: number;
  confidence?: number; // 0..1
}

export interface PaperExtractionRow {
  id: string;
  paperId: string;
  templateId: string;
  values: Record<string, ExtractedCellValue>;
  provenance: Record<string, CellProvenance>;
  quality?: number; // 0..1
  createdAt: ISODateString;
}

// Analytics Types
export interface ResearchTopic {
  name: string;
  count: number;
  relevance?: number;
}

export interface ResearchAnalytics {
  totalPapers: number;
  totalSessions: number;
  avgSessionTime: number;
  weeklySessions: number;
  monthlySessions: number;
  papersRead: number;
  topics: ResearchTopic[];
}

// Research View State Types
export interface CustomColumn extends ExtractionColumn {
  extractedValues?: Record<string, ExtractedCellValue>; // paperId -> value
  isExtracting?: boolean; // loading state
  error?: string; // extraction error
}

export interface SearchState {
  query: string;
  results: AcademicSearchResult | null;
  selectedPapers: string[];
  expandedPaperIds: string[];
  sidePanelPaperId: string | null;
  customColumns: CustomColumn[];
  columnVisibility: Record<string, boolean>;
  sorting: Array<{ id: string; desc: boolean }>;
  filters: {
    yearRange: [number | null, number | null];
    sources: string[];
    hasAbstract: boolean | null;
    hasPdf: boolean | null;
    journalQuality: number | null;
    studyTypes: string[];
  };
}

export type ExportFormat = 'csv' | 'bibtex' | 'ris' | 'json';
