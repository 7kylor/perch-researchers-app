import { contextBridge, ipcRenderer } from 'electron';
import type { Paper } from '../shared/types';

export type PreloadAPI = {
  getVersion: () => Promise<string>;
  papers: {
    add: (paper: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>) => Promise<string>;
    search: (q: string) => Promise<Paper[]>;
  };
  ingest: {
    doi: (doi: string) => Promise<string>;
    pdf: (absPath: string) => Promise<string>;
  };
};

const api: PreloadAPI = {
  getVersion: () => ipcRenderer.invoke('app:version'),
  papers: {
    add: (paper) => ipcRenderer.invoke('papers:add', paper),
    search: (q) => ipcRenderer.invoke('papers:search', q),
  },
  ingest: {
    doi: (doi) => ipcRenderer.invoke('import:doi', doi),
    pdf: (p) => ipcRenderer.invoke('import:pdf', p),
  },
};

declare global {
  interface Window {
    api: PreloadAPI;
  }
}

contextBridge.exposeInMainWorld('api', api);
