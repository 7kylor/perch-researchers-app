import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  page?: number;
}

export class OCRProcessor {
  private worker: Worker | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.worker = await createWorker('eng');
    this.initialized = true;
  }

  async processPDF(pdfPath: string): Promise<OCRResult[]> {
    if (!this.initialized) await this.initialize();

    const results: OCRResult[] = [];

    try {
      // For now, we'll process the first page as a demo
      // In a real implementation, this would process all pages
      const { data } = await this.worker!.recognize(pdfPath); // eslint-disable-line @typescript-eslint/no-non-null-assertion

      results.push({
        text: data.text,
        confidence: data.confidence,
        page: 1,
      });
    } catch {
      results.push({
        text: 'OCR processing failed',
        confidence: 0,
      });
    }

    return results;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

export async function processPaperOCR(paperId: string, pdfPath: string): Promise<string> {
  const processor = new OCRProcessor();
  try {
    await processor.initialize();
    const results = await processor.processPDF(pdfPath);

    // Combine all OCR results
    const fullText = results.map((r) => r.text).join('\n\n');
    return fullText;
  } finally {
    await processor.cleanup();
  }
}
