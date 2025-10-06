import { Paper } from '../shared/types';

export interface PreloadAPI {
  papers: {
    get: (id: string) => Promise<Paper | null>;
    add: (paper: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>) => Promise<string>;
    update: (id: string, updates: Partial<Paper>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    search: (query: string) => Promise<Paper[]>;
  };
  ingest: {
    pdf: (filePath: string) => Promise<string>;
    doi: (doi: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    api: PreloadAPI;
  }
}
