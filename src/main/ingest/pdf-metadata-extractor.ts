import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export interface ExtractedMetadata {
  title?: string;
  authors?: string[];
  year?: number;
  doi?: string;
  abstract?: string;
  keywords?: string[];
}

export class PDFMetadataExtractor {
  constructor() {
    // Configure worker for Node.js/Electron environment
    this.configureWorker();
  }

  private configureWorker(): void {
    try {
      // For ESM in Node.js/Electron, configure the worker path
      const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
      const workerUrl = pathToFileURL(workerPath).href;
      PDFParse.setWorker(workerUrl);
    } catch (error) {
      // If worker configuration fails, PDFParse will use default behavior
      console.warn('Failed to configure PDF.js worker:', error);
    }
  }

  /**
   * Extract metadata from PDF file
   */
  async extractFromFile(filePath: string): Promise<ExtractedMetadata> {
    let parser: PDFParse | null = null;

    try {
      const dataBuffer = await fs.readFile(filePath);
      parser = new PDFParse({ data: dataBuffer });

      // Get both info and text data
      const [infoResult, textResult] = await Promise.all([parser.getInfo(), parser.getText()]);

      return this.extractMetadataFromPDF(infoResult, textResult);
    } catch {
      return {};
    } finally {
      if (parser) {
        await parser.destroy();
      }
    }
  }

  /**
   * Extract metadata from parsed PDF data
   */
  private extractMetadataFromPDF(infoResult: any, textResult: any): ExtractedMetadata {
    const metadata: ExtractedMetadata = {};

    // Extract from PDF metadata
    if (infoResult?.info) {
      if (infoResult.info.Title) {
        metadata.title = this.cleanTitle(infoResult.info.Title);
      }
      if (infoResult.info.Author) {
        metadata.authors = this.parseAuthors(infoResult.info.Author);
      }
      if (infoResult.info.CreationDate) {
        const year = this.extractYear(infoResult.info.CreationDate);
        if (year) metadata.year = year;
      }
    }

    // Extract from text content (first 2 pages for metadata)
    const text = textResult?.text || '';
    const firstPages = text.slice(0, 5000); // First ~2 pages

    // Try to extract title from first line if not found in metadata
    if (!metadata.title) {
      metadata.title = this.extractTitleFromText(firstPages);
    }

    // Try to extract authors if not found
    if (!metadata.authors || metadata.authors.length === 0) {
      metadata.authors = this.extractAuthorsFromText(firstPages);
    }

    // Extract DOI
    const doi = this.extractDOI(firstPages);
    if (doi) metadata.doi = doi;

    // Extract year if not found
    if (!metadata.year) {
      metadata.year = this.extractYearFromText(firstPages);
    }

    // Extract abstract
    const abstract = this.extractAbstract(text);
    if (abstract) metadata.abstract = abstract;

    // Extract keywords
    const keywords = this.extractKeywords(text);
    if (keywords.length > 0) metadata.keywords = keywords;

    return metadata;
  }

  /**
   * Clean and normalize title
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000); // Max 1000 chars for longer titles
  }

  /**
   * Parse authors from string
   */
  private parseAuthors(authorString: string): string[] {
    // Split by common separators
    const authors = authorString
      .split(/[;,&]|(?:\s+and\s+)/i)
      .map((author) => author.trim())
      .filter((author) => author.length > 0 && author.length < 100);

    return authors;
  }

  /**
   * Extract year from date string or text
   */
  private extractYear(dateString: string): number | undefined {
    // Try to parse ISO date format or D:YYYYMMDDHHmmSS format
    const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      if (year >= 1900 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }
    return undefined;
  }

  /**
   * Extract title from first lines of text
   */
  private extractTitleFromText(text: string): string | undefined {
    // Get first non-empty lines that could be part of a title
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && line.length > 5); // Lower threshold for potential title parts

    // Look for consecutive lines that could form a title
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i];

      if (!line) continue;

      // Skip lines that look like headers, page numbers, or URLs
      if (
        line.length > 10 && // Increased minimum length
        !line.match(/^(page|doi|arxiv|http|www|\d+$)/i) &&
        !line.match(/^\d+$/) &&
        !line.match(
          /^(abstract|introduction|keywords?|references?|acknowledgments?|contents?|table of contents)$/i,
        )
      ) {
        // Check if this might be part of a multi-line title
        let potentialTitle = line;
        let nextLineIndex = i + 1;

        // Look ahead to see if next lines should be part of the title
        // Look further ahead and be more permissive
        while (nextLineIndex < lines.length && nextLineIndex < i + 8) {
          const nextLine = lines[nextLineIndex];

          if (!nextLine) break;

          // More permissive conditions for title continuation
          if (
            nextLine.length > 8 && // Lower threshold for continuation
            !nextLine.match(/^(page|doi|arxiv|http|www|\d+$)/i) &&
            !nextLine.match(/^\d+$/) &&
            !nextLine.match(
              /^(abstract|introduction|keywords?|references?|acknowledgments?|contents?|table of contents|author|authors)$/i,
            ) &&
            !nextLine.match(/^\s*$/) // Not empty or whitespace-only
          ) {
            potentialTitle += ' ' + nextLine;
            nextLineIndex++;
          } else {
            break;
          }
        }

        // Accept longer titles
        if (potentialTitle && potentialTitle.length > 30 && potentialTitle.length < 1500) {
          return this.cleanTitle(potentialTitle);
        }
      }
    }

    return undefined;
  }

  /**
   * Extract authors from text using common patterns
   */
  private extractAuthorsFromText(text: string): string[] {
    const authors: string[] = [];

    // Look for "Author:" or "Authors:" section - be more specific
    // Look for patterns that are clearly author sections, not title content
    const authorSection = text.match(
      /(?:^|\n)(?:Authors?|By)[:\s]*\n?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})*(?:\s*\n\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})*)/i,
    );
    if (authorSection?.[1]) {
      const extractedAuthors = this.parseAuthors(authorSection[1]);
      if (extractedAuthors.length > 0 && extractedAuthors.length <= 20) {
        // Filter out lines that look like they might be title fragments
        const filteredAuthors = extractedAuthors.filter(
          (author) =>
            author.length < 100 && // Authors shouldn't be extremely long
            !author.match(
              /learning|segmentation|techniques|structures|comparison|backpropagation/i,
            ) && // Filter out title-like words
            author.split(' ').length <= 5, // Authors typically have 1-5 words
        );
        if (filteredAuthors.length > 0) {
          return filteredAuthors;
        }
      }
    }

    // Look for email addresses (often near author names) - be more restrictive
    const emails = text.match(
      /\b[A-Z][a-z]+\s+[A-Z]\.[A-Z][a-z]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?=\s|$)/g,
    );
    if (emails && emails.length > 0 && emails.length <= 10) {
      return [...new Set(emails)];
    }

    return authors;
  }

  /**
   * Extract DOI from text
   */
  private extractDOI(text: string): string | undefined {
    // Common DOI patterns
    const doiPatterns = [
      /\b(10\.\d{4,}\/[^\s]+)/i,
      /doi[:\s]+(10\.\d{4,}\/[^\s]+)/i,
      /dx\.doi\.org\/(10\.\d{4,}\/[^\s]+)/i,
    ];

    for (const pattern of doiPatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        // Clean up the DOI
        const doi = match[1].replace(/[,;.\s]+$/, '');
        // Ensure it's not too long (valid DOIs are typically < 100 chars)
        if (doi.length < 100) {
          return doi;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract year from text
   */
  private extractYearFromText(text: string): number | undefined {
    // Look for year in common patterns
    const yearPatterns = [
      /\b(?:19|20)(\d{2})\b/g, // Any year 1900-2099
      /©\s*(\d{4})/g, // Copyright year
      /\((\d{4})\)/g, // Year in parentheses
    ];

    const years: number[] = [];
    for (const pattern of yearPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const year = parseInt(match[1] || match[0], 10);
        if (year >= 1900 && year <= new Date().getFullYear() + 1) {
          years.push(year);
        }
      }
    }

    // Return the most common year, or the latest one
    if (years.length > 0) {
      years.sort((a, b) => b - a);
      return years[0];
    }

    return undefined;
  }

  /**
   * Extract abstract from text
   */
  private extractAbstract(text: string): string | undefined {
    // Look for "Abstract" section
    const abstractMatch = text.match(
      /\bAbstract[:\s\n]+(.+?)(?=\n\s*\n|\bIntroduction\b|\bKeywords\b|$)/is,
    );

    if (abstractMatch?.[1]) {
      const abstract = abstractMatch[1].replace(/\s+/g, ' ').trim().slice(0, 2000); // Max 2000 chars

      if (abstract.length > 50 && abstract.length < 2000) {
        return abstract;
      }
    }

    return undefined;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Look for "Keywords:" section
    const keywordsMatch = text.match(/\bKeywords?[:\s]+([^\n]+)/i);

    if (keywordsMatch?.[1]) {
      const keywordsText = keywordsMatch[1];
      const keywords = keywordsText
        .split(/[;,•·]/)
        .map((kw) => kw.trim())
        .filter((kw) => kw.length > 2 && kw.length < 50)
        .slice(0, 10); // Max 10 keywords

      return keywords;
    }

    return [];
  }
}
