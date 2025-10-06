import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { randomUUID, createHash } from 'node:crypto';
import type { Paper } from '../../shared/types';
import https from 'node:https';
import http from 'node:http';
import { URLPaperDetector } from './url-paper-detector';
import { PDFMetadataExtractor } from './pdf-metadata-extractor';

export interface PDFImportProgress {
  stage: 'downloading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  filePath?: string;
}

export interface PDFImportResult {
  id: string;
  paper: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>;
  filePath: string;
}

export class PDFImportManager {
  private static instance: PDFImportManager;
  private activeImports = new Map<string, AbortController>();
  private urlPaperDetector: URLPaperDetector;
  private pdfMetadataExtractor: PDFMetadataExtractor;

  static getInstance(): PDFImportManager {
    if (!PDFImportManager.instance) {
      PDFImportManager.instance = new PDFImportManager();
    }
    return PDFImportManager.instance;
  }

  private constructor() {
    this.urlPaperDetector = new URLPaperDetector();
    this.pdfMetadataExtractor = new PDFMetadataExtractor();
  }

  async importFromUrl(url: string): Promise<PDFImportResult> {
    const importId = randomUUID();
    const abortController = new AbortController();
    this.activeImports.set(importId, abortController);

    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Check if it's actually a PDF URL
      if (!this.isPdfUrl(url)) {
        throw new Error('URL does not point to a PDF file');
      }

      // Download the PDF
      const filePath = await this.downloadPdf(url, abortController.signal);

      // Process the PDF file
      const paper = await this.processPdfFile(filePath, url);

      return {
        id: importId,
        paper,
        filePath,
      };
    } catch (error) {
      throw error;
    } finally {
      this.activeImports.delete(importId);
    }
  }

  async importFromLocalFile(filePath: string): Promise<PDFImportResult> {
    const importId = randomUUID();

    try {
      // Validate file exists and is a PDF
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('File is empty');
      }

      // Check if it's a PDF file
      const buffer = await fs.promises.readFile(filePath);
      if (!this.isPdfBuffer(buffer)) {
        throw new Error('File is not a valid PDF');
      }

      const paper = await this.processPdfFile(filePath);

      return {
        id: importId,
        paper,
        filePath,
      };
    } catch (error) {
      throw error;
    }
  }

  cancelImport(importId: string): boolean {
    const controller = this.activeImports.get(importId);
    if (controller) {
      controller.abort();
      this.activeImports.delete(importId);
      return true;
    }
    return false;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isPdfUrl(url: string): boolean {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return (
      pathname.endsWith('.pdf') ||
      url.includes('pdf') ||
      (urlObj.searchParams.has('format') && urlObj.searchParams.get('format') === 'pdf')
    );
  }

  private isPdfBuffer(buffer: Buffer): boolean {
    // Check PDF magic number (%PDF-)
    return (
      buffer.length >= 5 &&
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46 && // F
      buffer[4] === 0x2d
    ); // -
  }

  private async downloadPdf(url: string, signal?: AbortSignal): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      };

      const request = (isHttps ? https : http).request(options, (response) => {
        if (signal?.aborted) {
          reject(new Error('Download cancelled'));
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const _contentLength = parseInt(response.headers['content-length'] || '0');
        let _downloadedBytes = 0;

        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          if (signal?.aborted) {
            request.destroy();
            reject(new Error('Download cancelled'));
            return;
          }

          chunks.push(chunk);
          _downloadedBytes += chunk.length;

          // Progress tracking removed - will be handled differently if needed
        });

        response.on('end', async () => {
          if (signal?.aborted) {
            reject(new Error('Download cancelled'));
            return;
          }

          try {
            const buffer = Buffer.concat(chunks);

            // Validate downloaded content is actually a PDF
            if (!this.isPdfBuffer(buffer)) {
              reject(new Error('Downloaded file is not a valid PDF'));
              return;
            }

            // Save to temporary location first
            const tempDir = app.getPath('temp');
            const tempPath = path.join(tempDir, `pdf-import-${randomUUID()}.pdf`);

            await fs.promises.writeFile(tempPath, buffer);

            // Move to managed storage
            const managedPath = await this.moveToManagedStorage(tempPath);

            resolve(managedPath);
          } catch (error) {
            reject(error);
          }
        });

        response.on('error', (error) => {
          reject(new Error(`Download failed: ${error.message}`));
        });
      });

      request.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      if (signal) {
        signal.addEventListener('abort', () => {
          request.destroy();
        });
      }

      request.end();
    });
  }

  private async processPdfFile(
    filePath: string,
    originalUrl?: string,
  ): Promise<Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>> {
    const basename = path.basename(filePath, '.pdf');
    const buffer = await fs.promises.readFile(filePath);
    const textHash = createHash('sha256').update(buffer).digest('hex');

    // Copy to managed storage if not already there
    const managedPath = await this.moveToManagedStorage(filePath);

    // Try to extract metadata from URL if provided
    let metadata = null;
    if (originalUrl) {
      try {
        metadata = await this.urlPaperDetector.detectFromUrl(originalUrl);
      } catch {
        // Continue with PDF extraction
      }
    }

    // If no URL metadata, try extracting from PDF content
    let pdfMetadata = null;
    if (!metadata || !metadata.title) {
      try {
        pdfMetadata = await this.pdfMetadataExtractor.extractFromFile(managedPath);
      } catch {
        // Continue with filename
      }
    }

    // Merge metadata from multiple sources (URL > PDF > filename)
    const title = metadata?.title || pdfMetadata?.title || basename;
    const authors = metadata?.authors || pdfMetadata?.authors || [];
    const venue = metadata?.venue;
    const year = metadata?.year || pdfMetadata?.year;
    const doi =
      metadata?.doi ||
      pdfMetadata?.doi ||
      (originalUrl ? this.extractDoiFromUrl(originalUrl) : undefined);
    const source = metadata?.source || (originalUrl ? 'url' : 'pdf');
    const abstract = metadata?.abstract || pdfMetadata?.abstract;

    return {
      title,
      authors,
      venue,
      year,
      doi,
      source,
      abstract,
      status: 'to_read',
      filePath: managedPath,
      textHash,
    };
  }

  private async moveToManagedStorage(filePath: string): Promise<string> {
    const buffer = await fs.promises.readFile(filePath);
    const hash = createHash('sha256').update(buffer).digest('hex');

    const destDir = path.join(app.getPath('userData'), 'files');
    await fs.promises.mkdir(destDir, { recursive: true });

    const dest = path.join(destDir, `${hash}.pdf`);

    if (!fs.existsSync(dest)) {
      await fs.promises.copyFile(filePath, dest);
    }

    // Clean up temporary file if it exists
    if (filePath.includes('pdf-import-') && filePath.includes(app.getPath('temp'))) {
      try {
        await fs.promises.unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }

    return dest;
  }

  private extractDoiFromUrl(url: string): string | undefined {
    // Try to extract DOI from URL patterns like:
    // https://doi.org/10.1234/example
    // https://arxiv.org/pdf/1234.5678.pdf
    // https://example.com/papers/10.1234/example.pdf

    const doiMatch = url.match(/10\.\d{4,}\/[^\s&]+/);
    if (doiMatch) {
      return doiMatch[0];
    }

    return undefined;
  }

  getActiveImports(): string[] {
    return Array.from(this.activeImports.keys());
  }
}
