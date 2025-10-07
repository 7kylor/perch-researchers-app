import fs from 'node:fs/promises';
import { pdf as pdfParse } from 'pdf-parse';

export interface ExtractedMetadata {
  title?: string;
  authors?: string[];
  year?: number;
  doi?: string;
  abstract?: string;
  keywords?: string[];
}

export class PDFMetadataExtractor {
  /**
   * Extract metadata from PDF file
   */
  async extractFromFile(filePath: string): Promise<ExtractedMetadata> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);

      return this.extractMetadataFromPDF(pdfData);
    } catch {
      return {};
    }
  }

  /**
   * Extract metadata from parsed PDF data
   */
  private extractMetadataFromPDF(pdfData: {
    info?: { Title?: string; Author?: string; CreationDate?: string };
    text?: string;
  }): ExtractedMetadata {
    const metadata: ExtractedMetadata = {};

    // Extract from PDF metadata
    if (pdfData.info) {
      if (pdfData.info.Title) {
        metadata.title = this.cleanTitle(pdfData.info.Title);
      }
      if (pdfData.info.Author) {
        metadata.authors = this.parseAuthors(pdfData.info.Author);
      }
      if (pdfData.info.CreationDate) {
        const year = this.extractYear(pdfData.info.CreationDate);
        if (year) metadata.year = year;
      }
    }

    // Extract from text content (first 2 pages for metadata)
    const text = pdfData.text || '';
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
      .slice(0, 500); // Max 500 chars
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
    // Get first non-empty line that looks like a title
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 10);

    for (const line of lines.slice(0, 10)) {
      // Skip lines that look like headers, page numbers, or URLs
      if (
        line.length < 200 &&
        line.length > 10 &&
        !line.match(/^(page|doi|arxiv|http|www|\d+$)/i) &&
        !line.match(/^\d+$/)
      ) {
        return this.cleanTitle(line);
      }
    }

    return undefined;
  }

  /**
   * Extract authors from text using common patterns
   */
  private extractAuthorsFromText(text: string): string[] {
    const authors: string[] = [];

    // Look for "Author:" or "Authors:" section
    const authorSection = text.match(/(?:Authors?|By)[:\s]+([^\n]+(?:\n[A-Z][^\n]+){0,5})/i);
    if (authorSection?.[1]) {
      const extractedAuthors = this.parseAuthors(authorSection[1]);
      if (extractedAuthors.length > 0 && extractedAuthors.length <= 20) {
        return extractedAuthors;
      }
    }

    // Look for email addresses (often near author names)
    const emails = text.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+(?=.*?@)/g);
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
