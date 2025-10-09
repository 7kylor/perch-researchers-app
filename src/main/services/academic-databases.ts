import { google } from 'googleapis';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

export interface AcademicPaper {
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  abstract?: string;
  url?: string;
  citations?: number;
  source: 'googlescholar' | 'semanticscholar' | 'pubmed' | 'ieee';
}

export interface SearchResult {
  papers: AcademicPaper[];
  totalResults: number;
  searchTime: number;
}

export class AcademicDatabaseService {
  private googleScholarBaseUrl = 'https://scholar.google.com';
  private semanticScholarBaseUrl = 'https://api.semanticscholar.org/v1';
  private pubmedBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private ieeeBaseUrl = 'https://ieeexplore.ieee.org';

  // Google Scholar integration
  async searchGoogleScholar(query: string, limit: number = 20): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // For demo purposes, we'll use a web scraping approach
      // In production, you'd want to use official APIs or proper scraping with rate limiting
      const searchUrl = `${this.googleScholarBaseUrl}/scholar?q=${encodeURIComponent(query)}&hl=en`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Scholar search failed: ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const papers: AcademicPaper[] = [];
      const results = document.querySelectorAll('.gs_ri');

      for (const result of Array.from(results).slice(0, limit)) {
        const titleElement = result.querySelector('.gs_rt a, .gs_rt');
        const authorsElement = result.querySelector('.gs_a');
        const abstractElement = result.querySelector('.gs_rs');

        if (titleElement) {
          const title = titleElement.textContent?.trim() || '';
          const url = titleElement.href || '';

          // Parse authors and year from gs_a element
          const authorsText = authorsElement?.textContent || '';
          const yearMatch = authorsText.match(/(\d{4})/);
          const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

          // Extract authors (everything before the year)
          const authorsTextClean = authorsText.replace(/-\s*\d{4}.*/, '').trim();
          const authors = authorsTextClean
            .split(',')
            .map((author: string) => author.trim())
            .filter(Boolean);

          const abstract = abstractElement?.textContent?.trim() || '';

          papers.push({
            title,
            authors,
            year,
            abstract,
            url,
            source: 'googlescholar',
          });
        }
      }

      return {
        papers,
        totalResults: papers.length,
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Google Scholar search error:', error);
      return {
        papers: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
      };
    }
  }

  // Semantic Scholar integration
  async searchSemanticScholar(query: string, limit: number = 20): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${this.semanticScholarBaseUrl}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,venue,abstract,url,citationCount`,
      );

      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status}`);
      }

      const data = await response.json();

      const papers: AcademicPaper[] = data.data.map((paper: any) => ({
        title: paper.title,
        authors: paper.authors.map((author: any) => author.name),
        year: paper.year,
        venue: paper.venue,
        abstract: paper.abstract,
        url: paper.url,
        citations: paper.citationCount,
        source: 'semanticscholar' as const,
      }));

      return {
        papers,
        totalResults: data.total || papers.length,
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Semantic Scholar search error:', error);
      return {
        papers: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
      };
    }
  }

  // PubMed integration
  async searchPubMed(query: string, limit: number = 20): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // First, search for PMIDs
      const searchResponse = await fetch(
        `${this.pubmedBaseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`,
      );

      if (!searchResponse.ok) {
        throw new Error(`PubMed search error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const pmids = searchData.esearchresult?.idlist || [];

      if (pmids.length === 0) {
        return {
          papers: [],
          totalResults: 0,
          searchTime: Date.now() - startTime,
        };
      }

      // Fetch paper details
      const summaryResponse = await fetch(
        `${this.pubmedBaseUrl}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`,
      );

      if (!summaryResponse.ok) {
        throw new Error(`PubMed summary error: ${summaryResponse.status}`);
      }

      const summaryData = await summaryResponse.json();

      const papers: AcademicPaper[] = [];
      const results = summaryData.result || {};

      for (const pmid of pmids) {
        const paper = results[pmid];
        if (paper) {
          papers.push({
            title: paper.title,
            authors: paper.authors?.map((author: any) => `${author.name}`) || [],
            year: paper.pubdate ? new Date(paper.pubdate).getFullYear() : undefined,
            venue: paper.source,
            doi: paper.elocationid || paper.doi,
            abstract: paper.abstract || paper.description,
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}`,
            source: 'pubmed' as const,
          });
        }
      }

      return {
        papers,
        totalResults: parseInt(searchData.esearchresult?.count || '0'),
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('PubMed search error:', error);
      return {
        papers: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
      };
    }
  }

  // IEEE Xplore integration
  async searchIEEE(query: string, limit: number = 20): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // IEEE Xplore search - simplified for demo
      // In production, you'd use their official API
      const searchUrl = `${this.ieeeBaseUrl}/search/searchresult.jsp?queryText=${encodeURIComponent(query)}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`IEEE search failed: ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const papers: AcademicPaper[] = [];
      const results = document.querySelectorAll('.List-results .List-item');

      for (const result of Array.from(results).slice(0, limit)) {
        const titleElement = result.querySelector('.List-item-title a');
        const authorsElement = result.querySelector('.List-item-authors');
        const abstractElement = result.querySelector('.List-item-description');
        const yearElement = result.querySelector('.List-item-year');

        if (titleElement) {
          const title = titleElement.textContent?.trim() || '';
          const url = titleElement.href || '';

          const authors =
            authorsElement?.textContent
              ?.split(',')
              .map((author: string) => author.trim())
              .filter(Boolean) || [];
          const year = yearElement?.textContent
            ? parseInt(yearElement.textContent.trim())
            : undefined;
          const abstract = abstractElement?.textContent?.trim() || '';

          papers.push({
            title,
            authors,
            year,
            abstract,
            url,
            source: 'ieee' as const,
          });
        }
      }

      return {
        papers,
        totalResults: papers.length,
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('IEEE search error:', error);
      return {
        papers: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
      };
    }
  }

  // Multi-database search
  async searchAllDatabases(query: string, limit: number = 10): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const [scholarResults, semanticResults, pubmedResults, ieeeResults] =
        await Promise.allSettled([
          this.searchGoogleScholar(query, Math.floor(limit / 4)),
          this.searchSemanticScholar(query, Math.floor(limit / 4)),
          this.searchPubMed(query, Math.floor(limit / 4)),
          this.searchIEEE(query, Math.floor(limit / 4)),
        ]);

      const allPapers: AcademicPaper[] = [];

      if (scholarResults.status === 'fulfilled') {
        allPapers.push(...scholarResults.value.papers);
      }
      if (semanticResults.status === 'fulfilled') {
        allPapers.push(...semanticResults.value.papers);
      }
      if (pubmedResults.status === 'fulfilled') {
        allPapers.push(...pubmedResults.value.papers);
      }
      if (ieeeResults.status === 'fulfilled') {
        allPapers.push(...ieeeResults.value.papers);
      }

      // Remove duplicates based on title similarity and sort by relevance
      const uniquePapers = this.deduplicatePapers(allPapers);

      return {
        papers: uniquePapers.slice(0, limit),
        totalResults: uniquePapers.length,
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Multi-database search error:', error);
      return {
        papers: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
      };
    }
  }

  private deduplicatePapers(papers: AcademicPaper[]): AcademicPaper[] {
    const seen = new Set<string>();
    const unique: AcademicPaper[] = [];

    for (const paper of papers) {
      const key = paper.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(paper);
      }
    }

    return unique.sort((a, b) => {
      // Sort by year (newest first) and then by title
      if (a.year && b.year) {
        return b.year - a.year;
      }
      if (a.year) return -1;
      if (b.year) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  // Get paper details by DOI
  async getPaperByDOI(doi: string): Promise<AcademicPaper | null> {
    try {
      // Try Semantic Scholar first (they have good DOI coverage)
      const semanticResponse = await fetch(
        `${this.semanticScholarBaseUrl}/paper/DOI:${doi}?fields=title,authors,year,venue,abstract,url,citationCount,doi`,
      );

      if (semanticResponse.ok) {
        const data = await semanticResponse.json();
        return {
          title: data.title,
          authors: data.authors.map((author: any) => author.name),
          year: data.year,
          venue: data.venue,
          doi: data.doi,
          abstract: data.abstract,
          url: data.url,
          citations: data.citationCount,
          source: 'semanticscholar',
        };
      }

      // Fallback to CrossRef (would need API key in production)
      // For now, return null if not found in Semantic Scholar
      return null;
    } catch (error) {
      console.error('DOI lookup error:', error);
      return null;
    }
  }
}

export const academicDatabaseService = new AcademicDatabaseService();
