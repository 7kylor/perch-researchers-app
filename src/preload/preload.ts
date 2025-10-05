import { contextBridge, ipcRenderer } from 'electron';
import type { Paper } from '../shared/types';

export type PreloadAPI = {
  getVersion: () => Promise<string>;
  papers: {
    add: (paper: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>) => Promise<string>;
    search: (q: string) => Promise<Paper[]>;
    get: (id: string) => Promise<Paper | null>;
  };
  ingest: {
    doi: (doi: string) => Promise<string>;
    pdf: (absPath: string) => Promise<string>;
  };
  files: { read: (absPath: string) => Promise<Uint8Array> };
  annotations: {
    add: (payload: {
      paperId: string;
      page: number;
      color: string;
      note?: string;
      tags: string[];
      anchors: { region?: { page: number; x: number; y: number; width: number; height: number } };
    }) => Promise<string>;
    getByPaper: (paperId: string) => Promise<
      Array<{
        id: string;
        paperId: string;
        page: number;
        color: string;
        note?: string;
        tags: string[];
        anchors: { region?: { page: number; x: number; y: number; width: number; height: number } };
        createdAt: string;
      }>
    >;
    update: (
      id: string,
      updates: Partial<{
        color: string;
        note?: string;
        tags: string[];
      }>,
    ) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  embeddings: {
    process: (paperId: string, text: string) => Promise<void>;
    searchSimilar: (
      query: string,
      limit?: number,
    ) => Promise<Array<{ paperId: string; title: string; score: number }>>;
  };
  ai: {
    init: (type: 'openai' | 'local', apiKey?: string) => Promise<void>;
    summarize: (paperId: string) => Promise<string>;
    question: (question: string, paperId?: string) => Promise<string>;
    related: (query: string) => Promise<Array<{ paperId: string; title: string; score: number }>>;
    usage: () => Promise<number>;
  };
  ocr: {
    process: (paperId: string, pdfPath: string) => Promise<string>;
  };
};

const api: PreloadAPI = {
  getVersion: () => ipcRenderer.invoke('app:version'),
  papers: {
    add: (paper) => ipcRenderer.invoke('papers:add', paper),
    search: (q) => ipcRenderer.invoke('papers:search', q),
    get: (id) => ipcRenderer.invoke('papers:get', id),
  },
  ingest: {
    doi: (doi) => ipcRenderer.invoke('import:doi', doi),
    pdf: (p) => ipcRenderer.invoke('import:pdf', p),
  },
  files: { read: (p) => ipcRenderer.invoke('file:read', p) },
  annotations: {
    add: (payload) => ipcRenderer.invoke('annotations:add', payload),
    getByPaper: (paperId) => ipcRenderer.invoke('annotations:getByPaper', paperId),
    update: (id, updates) => ipcRenderer.invoke('annotations:update', id, updates),
    delete: (id) => ipcRenderer.invoke('annotations:delete', id),
  },
  embeddings: {
    process: (paperId, text) => ipcRenderer.invoke('embeddings:process', paperId, text),
    searchSimilar: (query, limit) => ipcRenderer.invoke('search:similar', query, limit),
  },
  ai: {
    init: (type, apiKey) => ipcRenderer.invoke('ai:init', type, apiKey),
    summarize: (paperId) => ipcRenderer.invoke('ai:summarize', paperId),
    question: (question, paperId) => ipcRenderer.invoke('ai:question', question, paperId),
    related: (query) => ipcRenderer.invoke('ai:related', query),
    usage: () => ipcRenderer.invoke('ai:usage'),
  },
  ocr: {
    process: (paperId, pdfPath) => ipcRenderer.invoke('ocr:process', paperId, pdfPath),
  },
};

declare global {
  interface Window {
    api: PreloadAPI;
  }
}

contextBridge.exposeInMainWorld('api', api);
