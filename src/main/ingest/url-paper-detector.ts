import * as arxivApi from 'arxiv-api';

interface ArxivLink {
  href?: string;
  title?: string;
}

interface ArxivCategory {
  term?: string;
}

export interface PaperMetadata {
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  source: 'url' | 'arxiv' | 'pubmed' | 'crossref' | 'semanticscholar' | 'pdf';
  originalUrl?: string;
  filePath?: string;
}

export class URLPaperDetector {
  constructor() {
    // No initialization needed for the search function
  }

  async detectFromUrl(url: string): Promise<PaperMetadata | null> {
    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(url);

      // Check if it's an arXiv URL
      if (this.isArxivUrl(normalizedUrl)) {
        return await this.extractFromArxiv(normalizedUrl);
      }

      // Check if it's a DOI URL
      if (this.isDoiUrl(normalizedUrl)) {
        return await this.extractFromDoi(normalizedUrl);
      }

      // For other URLs, try to extract basic info
      return await this.extractFromGenericUrl(normalizedUrl);
    } catch {
      return null;
    }
  }

  private normalizeUrl(url: string): string {
    // Remove trailing slashes and normalize
    return url.trim().replace(/\/+$/, '');
  }

  private isArxivUrl(url: string): boolean {
    const arxivPatterns = [
      /arxiv\.org\/abs\/(\d+\.\d+)(v\d+)?/,
      /arxiv\.org\/pdf\/(\d+\.\d+)(v\d+)?(\.pdf)?/, // .pdf extension is optional
      /arxiv\.org\/html\/(\d+\.\d+)(v\d+)?/,
      /arxiv\.org\/format\/\d+\.\d+/,
    ];

    return arxivPatterns.some((pattern) => pattern.test(url));
  }

  private isDoiUrl(url: string): boolean {
    // DOI patterns
    const doiPatterns = [
      /^10\.\d{4,}\/[^\s&]+$/,
      /doi\.org\/10\.\d{4,}\/[^\s&]+/,
      /dx\.doi\.org\/10\.\d{4,}\/[^\s&]+/,
    ];

    return doiPatterns.some((pattern) => pattern.test(url));
  }

  private async extractFromArxiv(url: string): Promise<PaperMetadata | null> {
    try {
      // Extract arXiv ID from URL
      const arxivId = this.extractArxivId(url);
      if (!arxivId) {
        return null;
      }

      // Search for the paper using the arXiv ID
      const results = await arxivApi.search({
        searchQueryParams: [{ include: [{ name: arxivId, prefix: 'all' }] }],
        maxResults: 1,
      });

      if (results && results.length > 0) {
        const entry = results[0];
        if (!entry) return null;

        // Extract arXiv ID from entry.id for DOI construction
        const arxivIdMatch = entry.id.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
        const extractedArxivId = arxivIdMatch ? arxivIdMatch[1] : null;

        // Extract DOI from links if available, or construct from arXiv ID
        const doiLink = entry.links?.find((link: ArxivLink) => link.href?.includes('doi.org'));
        const doi = doiLink
          ? doiLink.href.match(/doi\.org\/(.+)/)?.[1]
          : extractedArxivId
            ? `10.48550/arXiv.${extractedArxivId}`
            : undefined;

        // Flatten authors array (they come as nested arrays like [["Name"]])
        // Need to flatten twice: first to get ["Name"], then join all authors
        const authors =
          entry.authors
            ?.flat()
            .flat()
            .filter(
              (author): author is string => typeof author === 'string' && author.length > 0,
            ) || [];

        // Extract categories for venue information
        const categories =
          entry.categories?.map((cat: ArxivCategory) => cat.term).filter(Boolean) || [];
        const venue = categories.length > 0 ? categories.join(', ') : undefined;

        // Extract PDF link for filePath
        const pdfLink = entry.links?.find((link: ArxivLink) => link.href?.includes('.pdf'));
        const filePath = pdfLink ? pdfLink.href : undefined;

        return {
          title: entry.title,
          authors: authors,
          venue: venue,
          year: entry.published ? new Date(entry.published).getFullYear() : undefined,
          doi: doi,
          abstract: entry.summary,
          source: 'arxiv',
          originalUrl: url,
          filePath: filePath,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private extractArxivId(url: string): string | null {
    // Extract arXiv ID from various URL formats
    const patterns = [
      /arxiv\.org\/abs\/(\d+\.\d+(?:v\d+)?)/,
      /arxiv\.org\/pdf\/(\d+\.\d+(?:v\d+)?)/,
      /arxiv\.org\/html\/(\d+\.\d+(?:v\d+)?)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  private async extractFromDoi(url: string): Promise<PaperMetadata | null> {
    try {
      // Extract DOI from URL
      const doi = this.extractDoi(url);
      if (!doi) {
        return null;
      }

      // For now, we'll just mark it as a DOI source
      // In a full implementation, you might want to use CrossRef API or similar
      return {
        title: `Paper with DOI: ${doi}`,
        authors: [],
        doi: doi,
        source: 'crossref',
        originalUrl: url,
      };
    } catch {
      return null;
    }
  }

  private extractDoi(url: string): string | null {
    // Extract DOI from various URL formats
    const patterns = [
      /doi\.org\/(10\.\d{4,}\/[^\s&]+)/,
      /dx\.doi\.org\/(10\.\d{4,}\/[^\s&]+)/,
      /^(10\.\d{4,}\/[^\s&]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  private async extractFromGenericUrl(url: string): Promise<PaperMetadata | null> {
    // For generic URLs, we can't extract much metadata without scraping
    // This is a fallback that just marks the source as 'url'
    return {
      title: `Paper from URL`,
      authors: [],
      source: 'url',
      originalUrl: url,
    };
  }

  async detectFromArxivId(arxivId: string): Promise<PaperMetadata | null> {
    try {
      const results = await arxivApi.search({
        searchQueryParams: [{ include: [{ name: arxivId, prefix: 'all' }] }],
        maxResults: 1,
      });

      if (results && results.length > 0) {
        const entry = results[0];
        if (!entry) return null;

        // Extract DOI from links if available, or construct from arXiv ID
        const doiLink = entry.links?.find((link: ArxivLink) => link.href?.includes('doi.org'));
        const doi = doiLink
          ? doiLink.href.match(/doi\.org\/(.+)/)?.[1]
          : `10.48550/arXiv.${arxivId}`;

        // Flatten authors array (they come as nested arrays like [["Name"]])
        // Need to flatten twice: first to get ["Name"], then join all authors
        const authors =
          entry.authors
            ?.flat()
            .flat()
            .filter(
              (author): author is string => typeof author === 'string' && author.length > 0,
            ) || [];

        // Extract categories for venue information
        const categories =
          entry.categories?.map((cat: ArxivCategory) => cat.term).filter(Boolean) || [];
        const venue = categories.length > 0 ? categories.join(', ') : undefined;

        // Extract PDF link for filePath
        const pdfLink = entry.links?.find((link: ArxivLink) => link.href?.includes('.pdf'));
        const filePath = pdfLink ? pdfLink.href : undefined;

        return {
          title: entry.title,
          authors: authors,
          venue: venue,
          year: entry.published ? new Date(entry.published).getFullYear() : undefined,
          doi: doi,
          abstract: entry.summary,
          source: 'arxiv',
          originalUrl: `https://arxiv.org/abs/${arxivId}`,
          filePath: filePath,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}
