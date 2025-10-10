import fetch from 'node-fetch';
import type { AcademicPaper } from '../../shared/types.js';

export type OpenAlexFilters = {
  fromYear?: number;
  toYear?: number;
  openAccess?: boolean;
  minCitations?: number;
  type?: 'journal-article' | 'conference-paper' | 'other';
};

export type OpenAlexSearchResult = {
  papers: AcademicPaper[];
  totalResults: number;
  searchTime: number;
};

function buildFilterQuery(filters?: OpenAlexFilters): string {
  if (!filters) return '';
  const parts: string[] = [];
  if (filters.fromYear || filters.toYear) {
    const from = filters.fromYear ?? 0;
    const to = filters.toYear ?? 3000;
    parts.push(`from_publication_date:${from}-01-01,until_publication_date:${to}-12-31`);
  }
  if (filters.openAccess !== undefined) {
    parts.push(`is_oa:${filters.openAccess ? 'true' : 'false'}`);
  }
  if (filters.minCitations !== undefined) {
    parts.push(`cited_by_count:>=${filters.minCitations}`);
  }
  if (filters.type) {
    parts.push(`type:${filters.type}`);
  }
  return parts.length > 0 ? `&filter=${encodeURIComponent(parts.join(','))}` : '';
}

export class OpenAlexService {
  private readonly baseUrl = 'https://api.openalex.org/works';

  async search(
    query: string,
    limit = 25,
    page = 1,
    filters?: OpenAlexFilters,
  ): Promise<OpenAlexSearchResult> {
    const start = Date.now();
    const searchParams = `search=${encodeURIComponent(query)}&per_page=${limit}&page=${page}`;
    const filterParams = buildFilterQuery(filters);
    const url = `${this.baseUrl}?${searchParams}${filterParams}&mailto=opensource@local.test`;

    const res = await fetch(url);
    if (!res.ok) {
      return { papers: [], totalResults: 0, searchTime: Date.now() - start };
    }
    const data = (await res.json()) as {
      results?: Array<{
        display_name?: string;
        authorships?: Array<{ authors?: Array<{ display_name?: string }> }>;
        publication_year?: number;
        host_venue?: { display_name?: string; is_oa?: boolean; url?: string };
        doi?: string;
        abstract_inverted_index?: Record<string, number[]> | null;
        primary_location?: { source?: { url?: string }; landing_page_url?: string };
        cited_by_count?: number;
      }>;
      meta?: { count?: number };
    };

    const papers: AcademicPaper[] = (data.results || []).map((r) => {
      const authors: string[] = (r.authorships || [])
        .flatMap((a) => a.authors || [])
        .map((a) => a?.display_name || '')
        .filter(Boolean);
      const abstract = r.abstract_inverted_index
        ? Object.entries(r.abstract_inverted_index)
            .sort((a, b) => (a[1]?.[0] || 0) - (b[1]?.[0] || 0))
            .map(([word]) => word)
            .join(' ')
        : undefined;
      const url =
        r.primary_location?.landing_page_url ||
        r.primary_location?.source?.url ||
        r.host_venue?.url ||
        undefined;
      return {
        title: r.display_name || '',
        authors,
        year: r.publication_year,
        venue: r.host_venue?.display_name,
        doi: r.doi,
        abstract,
        url,
        citations: r.cited_by_count,
        source: 'openalex',
      };
    });

    return {
      papers,
      totalResults: data.meta?.count || papers.length,
      searchTime: Date.now() - start,
    };
  }
}

export const openAlexService = new OpenAlexService();
