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
    | 'pdf';
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
