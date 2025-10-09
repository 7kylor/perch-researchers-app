import type { Paper } from '../shared/types';
import type { SidebarListResponse, SidebarNode, SidebarPrefs } from '../shared/sidebar';
import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import fs from 'node:fs';

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
  'pdf-reader': {
    'create-window': (paper: Paper) => Promise<string>;
    'close-window': (windowId?: string) => Promise<boolean>;
    'get-file-path': (paperId: string) => Promise<string | null>;
    'file-exists': (filePath: string) => Promise<boolean>;
    'get-windows': () => Promise<string[]>;
    'focus-window': (windowId: string) => Promise<boolean>;
  };
  annotations: {
    add: (payload: {
      paperId: string;
      page: number;
      color: string;
      note?: string;
      tags: string[];
      anchors: { region?: { page: number; x: number; y: number; width: number; height: number } };
    }) => Promise<string>;
    getByPaper: (paperId: string) => Promise<import('../shared/types').Annotation[]>;
    update: (id: string, updates: Partial<{ color: string; note?: string; tags: string[] }>) => Promise<void>;
    delete: (id: string) => Promise<void>;
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

function readFileBuffer(filePath: string): ArrayBuffer {
  const buf = fs.readFileSync(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

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
  'pdf-reader': {
    'create-window': (paper: Paper) => ipcRenderer.invoke('pdf-reader:create-window', paper),
    // If a windowId is provided, close that specific window. If omitted, close the sender window.
    'close-window': (windowId?: string) =>
      windowId
        ? ipcRenderer.invoke('pdf-reader:close-window', windowId)
        : ipcRenderer.invoke('pdf-reader:close-self'),
    'get-file-path': (paperId: string) => ipcRenderer.invoke('pdf-reader:get-file-path', paperId),
    'file-exists': (filePath: string) => ipcRenderer.invoke('pdf-reader:file-exists', filePath),
    'get-windows': () => ipcRenderer.invoke('pdf-reader:get-windows'),
    'focus-window': (windowId: string) => ipcRenderer.invoke('pdf-reader:focus-window', windowId),
  },
  annotations: {
    add: (payload: unknown) => ipcRenderer.invoke('annotations:add', payload),
    getByPaper: (paperId: string) => ipcRenderer.invoke('annotations:getByPaper', paperId),
    update: (id: string, updates: unknown) => ipcRenderer.invoke('annotations:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('annotations:delete', id),
  },
  file: {
    // Read file directly from preload for ArrayBuffer results (avoids IPC marshalling quirks)
    read: async (filePath: string) => readFileBuffer(filePath),
  },
  dialog: {
    showOpenDialog: (options?: OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:showOpenDialog', options),
  },
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => {
      // Normalize to the data payload(s) only; single arg becomes listener(arg)
      if (args.length <= 1) listener(args[0]);
      else listener(...(args as unknown[]));
    });
  },
  sidebar: {
    list: () => ipcRenderer.invoke('sidebar:list'),
    create: (node: unknown) => ipcRenderer.invoke('sidebar:create', node),
    update: (id: string, updates: unknown) => ipcRenderer.invoke('sidebar:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('sidebar:delete', id),
    move: (id: string, newParentId: string, newIndex: number) =>
      ipcRenderer.invoke('sidebar:move', id, newParentId, newIndex),
    prefs: {
      get: () => ipcRenderer.invoke('sidebar:prefs:get'),
      set: (prefs: unknown) => ipcRenderer.invoke('sidebar:prefs:set', prefs),
    },
  },
});
