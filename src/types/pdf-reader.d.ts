// PDF Reader Types

// DOM types for PDF rendering
interface HTMLCanvasElement {
  width: number;
  height: number;
  getContext(contextId: string): CanvasRenderingContext2D | null;
}

interface CanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  // Add other canvas context methods as needed
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  source?: string;
  abstract?: string;
  status: string;
  filePath?: string;
  textHash: string;
}

export interface PDFDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPage>;
}

export interface PDFPage {
  getViewport(options: { scale: number; rotation?: number }): PDFViewport;
  render(renderContext: PDFRenderContext): PDFRenderTask;
  getTextContent(): Promise<PDFTextContent>;
}

export interface PDFViewport {
  width: number;
  height: number;
  transform: number[];
}

export interface PDFRenderContext {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
  transform?: number[];
}

export interface PDFRenderTask {
  promise: Promise<void>;
  cancel(): void;
}

export interface PDFTextContent {
  items: PDFTextItem[];
}

export interface PDFTextItem {
  str: string;
  transform: number[];
  height: number;
  width: number;
}

export interface PDFReaderAPI {
  'pdf-reader:close-window': () => void;
  'pdf-reader:get-file-path': (paperId: string) => Promise<string | null>;
  'pdf-reader:file-exists': (filePath: string) => Promise<boolean>;
  'pdf-reader:paper-loaded': (paper: Paper) => void;
  'file:read': (filePath: string) => Promise<ArrayBuffer>;
}

export interface PDFReaderState {
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  isRendering: boolean;
  fitToWidth: boolean;
}

export type ZoomLevel = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0 | 3.0 | 4.0;

export interface PDFViewerControls {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWidth: () => void;
  fitToPage: () => void;
  rotate: () => void;
  goToPage: (pageNumber: number) => void;
}
