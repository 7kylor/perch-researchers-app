import { Paper } from '../shared/types';
import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';

export interface PDFImportProgress {
  stage: 'downloading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  filePath?: string;
}

export interface PDFImportResult {
  id: string;
  paper: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>;
  filePath: string;
}

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
  pdf: {
    'import-from-url': (
      url: string,
      onProgress?: (progress: PDFImportProgress) => void,
    ) => Promise<PDFImportResult>;
    'import-from-file': (
      filePath: string,
      onProgress?: (progress: PDFImportProgress) => void,
    ) => Promise<PDFImportResult>;
    'cancel-import': (importId: string) => Promise<boolean>;
    'get-active-imports': () => Promise<string[]>;
  };
  'pdf-reader': {
    'create-window': (paper: Paper) => Promise<string>;
    'close-window': (windowId?: string) => Promise<boolean>;
    'get-file-path': (paperId: string) => Promise<string | null>;
    'file-exists': (filePath: string) => Promise<boolean>;
    'get-windows': () => Promise<string[]>;
    'focus-window': (windowId: string) => Promise<boolean>;
  };
  file: {
    read: (filePath: string) => Promise<ArrayBuffer>;
  };
  dialog: {
    showOpenDialog: (options?: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
  };
  on: (channel: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    api: PreloadAPI;
  }
}

// Context Bridge Setup
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  papers: {
    get: (id: string) => ipcRenderer.invoke('papers:get', id),
    add: (paper: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>) =>
      ipcRenderer.invoke('papers:add', paper),
    update: (id: string, updates: Partial<Paper>) =>
      ipcRenderer.invoke('papers:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('papers:delete', id),
    search: (query: string) => ipcRenderer.invoke('papers:search', query),
  },
  ingest: {
    pdf: (filePath: string) => ipcRenderer.invoke('import:pdf', filePath),
    doi: (doi: string) => ipcRenderer.invoke('import:doi', doi),
  },
  pdf: {
    'import-from-url': (url: string, onProgress?: (progress: PDFImportProgress) => void) =>
      ipcRenderer.invoke('pdf:import-from-url', url, onProgress),
    'import-from-file': (filePath: string, onProgress?: (progress: PDFImportProgress) => void) =>
      ipcRenderer.invoke('pdf:import-from-file', filePath, onProgress),
    'cancel-import': (importId: string) => ipcRenderer.invoke('pdf:cancel-import', importId),
    'get-active-imports': () => ipcRenderer.invoke('pdf:get-active-imports'),
  },
  'pdf-reader': {
    'create-window': (paper: Paper) => ipcRenderer.invoke('pdf-reader:create-window', paper),
    'close-window': (windowId?: string) => ipcRenderer.invoke('pdf-reader:close-window', windowId),
    'get-file-path': (paperId: string) => ipcRenderer.invoke('pdf-reader:get-file-path', paperId),
    'file-exists': (filePath: string) => ipcRenderer.invoke('pdf-reader:file-exists', filePath),
    'get-windows': () => ipcRenderer.invoke('pdf-reader:get-windows'),
    'focus-window': (windowId: string) => ipcRenderer.invoke('pdf-reader:focus-window', windowId),
  },
  file: {
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  },
  dialog: {
    showOpenDialog: (options?: OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:showOpenDialog', options),
  },
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, listener);
  },
});
