declare module 'arxiv-api' {
  export interface ArxivSearchResult {
    id: string;
    title: string;
    summary: string;
    // Authors come as nested arrays: [["Author Name"]]
    authors: string[][];
    links: Array<{ href: string; title?: string; rel?: string; type?: string }>;
    published: string;
    updated: string;
    categories: Array<{ term: string; scheme?: string }>;
  }

  export interface SearchOptions {
    searchQueryParams: Array<{
      include: Array<{ name: string; prefix?: string }>;
      exclude?: Array<{ name: string; prefix?: string }>;
    }>;
    sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
    sortOrder?: 'ascending' | 'descending';
    start?: number;
    maxResults?: number;
  }

  export function search(options: SearchOptions): Promise<ArxivSearchResult[]>;
}
