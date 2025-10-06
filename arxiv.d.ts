declare module 'arxiv' {
  export interface ArxivAuthor {
    name: string;
  }

  export interface ArxivEntry {
    title: string;
    authors: ArxivAuthor[];
    summary: string;
    published: string;
    journal?: {
      title: string;
    };
    doi?: string;
  }

  export interface ArxivResponse {
    entries: ArxivEntry[];
  }

  export class ArxivAPI {
    get(id: string): Promise<ArxivResponse>;
  }
}
