import type { Paper } from '../shared/types.js';
import type { SidebarListResponse, SidebarNode, SidebarPrefs } from '../shared/sidebar.js';
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
    listByCategory: (nodeId: string, limit?: number) => Promise<Paper[]>;
  };
  ingest: {
    pdf: (filePath: string) => Promise<string>;
    doi: (doi: string) => Promise<string>;
  };
  pdf: {
    'import-from-url': (url: string) => Promise<PDFImportResult>;
    'import-from-file': (filePath: string) => Promise<PDFImportResult>;
    'cancel-import': (importId: string) => Promise<boolean>;
    'get-active-imports': () => Promise<string[]>;
  };
  url: {
    'detect-paper': (url: string) => Promise<{
      title: string;
      authors: string[];
      venue?: string;
      year?: number;
      doi?: string;
      abstract?: string;
      source: string;
      filePath?: string;
      originalUrl?: string;
    } | null>;
    'detect-arxiv-id': (arxivId: string) => Promise<{
      title: string;
      authors: string[];
      venue?: string;
      year?: number;
      doi?: string;
      abstract?: string;
      source: string;
      filePath?: string;
      originalUrl?: string;
    } | null>;
  };
  'pdf-reader': {
    'create-window': (paper: Paper) => Promise<string>;
    'close-window': (windowId?: string) => Promise<boolean>;
    'get-file-path': (paperId: string) => Promise<string | null>;
    'file-exists': (filePath: string) => Promise<boolean>;
    'get-windows': () => Promise<string[]>;
    'focus-window': (windowId: string) => Promise<boolean>;
    'get-annotations': (paperId: string) => Promise<Record<string, unknown[]>>;
    'save-annotations': (
      paperId: string,
      annotations: Record<string, unknown[]>,
    ) => Promise<boolean>;
  };
  pdfReader: {
    onPaperLoaded: (callback: (paper: Paper) => void) => void;
  };
  file: {
    read: (filePath: string) => Promise<ArrayBuffer>;
  };
  dialog: {
    showOpenDialog: (options?: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
  };
  on: (channel: string, listener: (...args: unknown[]) => void) => void;
  sidebar: {
    list: () => Promise<SidebarListResponse>;
    create: (
      node: Partial<SidebarNode> & {
        type: 'folder' | 'label';
        name: string;
        parentId?: string | null;
      },
    ) => Promise<SidebarNode>;
    update: (
      id: string,
      updates: Partial<Pick<SidebarNode, 'name' | 'iconKey' | 'colorHex'>>,
    ) => Promise<void>;
    delete: (id: string) => Promise<void>;
    move: (id: string, newParentId: string | null, newIndex: number) => Promise<void>;
    prefs: {
      get: () => Promise<SidebarPrefs>;
      set: (prefs: SidebarPrefs) => Promise<void>;
    };
  };
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
    listByCategory: (nodeId: string, limit?: number) =>
      ipcRenderer.invoke('papers:listByCategory', nodeId, limit),
  },
  ingest: {
    pdf: (filePath: string) => ipcRenderer.invoke('import:pdf', filePath),
    doi: (doi: string) => ipcRenderer.invoke('import:doi', doi),
  },
  pdf: {
    'import-from-url': (url: string) => ipcRenderer.invoke('pdf:import-from-url', url),
    'import-from-file': (filePath: string) => ipcRenderer.invoke('pdf:import-from-file', filePath),
    'cancel-import': (importId: string) => ipcRenderer.invoke('pdf:cancel-import', importId),
    'get-active-imports': () => ipcRenderer.invoke('pdf:get-active-imports'),
  },
  url: {
    'detect-paper': (url: string) => ipcRenderer.invoke('url:detect-paper', url),
    'detect-arxiv-id': (arxivId: string) => ipcRenderer.invoke('url:detect-arxiv-id', arxivId),
  },
  'pdf-reader': {
    'create-window': (paper: Paper) => ipcRenderer.invoke('pdf-reader:create-window', paper),
    'close-window': (windowId?: string) => ipcRenderer.invoke('pdf-reader:close-window', windowId),
    'get-file-path': (paperId: string) => ipcRenderer.invoke('pdf-reader:get-file-path', paperId),
    'file-exists': (filePath: string) => ipcRenderer.invoke('pdf-reader:file-exists', filePath),
    'get-windows': () => ipcRenderer.invoke('pdf-reader:get-windows'),
    'focus-window': (windowId: string) => ipcRenderer.invoke('pdf-reader:focus-window', windowId),
    'get-annotations': (paperId: string) =>
      ipcRenderer.invoke('pdf-reader:get-annotations', paperId),
    'save-annotations': (paperId: string, annotations: Record<string, unknown[]>) =>
      ipcRenderer.invoke('pdf-reader:save-annotations', paperId, annotations),
  },
  pdfReader: {
    onPaperLoaded: (callback: (paper: Paper) => void) => {
      ipcRenderer.on('pdf-reader:paper-loaded', (_event, paper) => callback(paper));
    },
  },
  file: {
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    write: (filePath: string, data: ArrayBuffer | string) =>
      ipcRenderer.invoke('file:write', filePath, data),
  },
  dialog: {
    showOpenDialog: (options?: OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:showOpenDialog', options),
  },
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => listener(...args));
  },
  sidebar: {
    list: () => ipcRenderer.invoke('sidebar:list'),
    create: (node: unknown) => ipcRenderer.invoke('sidebar:create', node),
    update: (id: string, updates: unknown) => ipcRenderer.invoke('sidebar:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('sidebar:delete', id),
    move: (id: string, newParentId: string | null, newIndex: number) =>
      ipcRenderer.invoke('sidebar:move', id, newParentId, newIndex),
    prefs: {
      get: () => ipcRenderer.invoke('sidebar:prefs:get'),
      set: (prefs: unknown) => ipcRenderer.invoke('sidebar:prefs:set', prefs),
    },
  },
});
