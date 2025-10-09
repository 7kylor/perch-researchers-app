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
  settings: {
    get: () => Promise<{ autoUpdateEnabled: boolean }>;
    set: (partial: Partial<{ autoUpdateEnabled: boolean }>) => Promise<{ autoUpdateEnabled: boolean }>;
  };
  updates: {
    check: () => Promise<{ success: boolean; updateInfo?: unknown | null; error?: string }>;
    download: () => Promise<{ success: boolean; error?: string }>;
    quitAndInstall: () => Promise<{ success: boolean }>;
    onAvailable: (listener: (info: unknown) => void) => void;
    onDownloaded: (listener: (info: unknown) => void) => void;
    onNotAvailable: (listener: () => void) => void;
    onError: (listener: (message: string) => void) => void;
  };
  ai: {
    init: (type: 'openai' | 'local', apiKey?: string) => Promise<void>;
    summarize: (paperId: string) => Promise<string>;
    question: (question: string, paperId?: string) => Promise<string>;
    related: (query: string) => Promise<Array<{ paperId: string; title: string; score: number }>>;
    usage: () => Promise<number>;
    chat: {
      start: (params: {
        mode: 'openai' | 'local';
        apiKey?: string;
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
        temperature?: number;
      }) => Promise<string>; // chatId
      stop: (chatId: string) => Promise<boolean>;
      onChunk: (listener: (payload: { chatId: string; delta: string }) => void) => void;
      onDone: (listener: (payload: { chatId: string }) => void) => void;
      onError: (listener: (payload: { chatId: string; error: string }) => void) => void;
    };
  };
  license: {
    set: (pro: boolean) => Promise<void>;
    get: () => Promise<{ pro: boolean }>;
  };
  localAI: {
    start: (cfg: {
      binaryPath: string;
      modelPath: string;
      port?: number;
      contextSize?: number;
      gpuLayers?: number;
      threads?: number;
      extraArgs?: string[];
    }) => Promise<string>;
    stop: () => Promise<boolean>;
    status: () => Promise<{ running: boolean; url: string | null }>;
    downloadModel: (payload: { url: string; destDir: string }) => Promise<string>;
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
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (partial: { autoUpdateEnabled?: boolean }) => ipcRenderer.invoke('settings:set', partial),
  },
  updates: {
    check: () => ipcRenderer.invoke('updates:check'),
    download: () => ipcRenderer.invoke('updates:download'),
    quitAndInstall: () => ipcRenderer.invoke('updates:quit-and-install'),
    onAvailable: (listener: (info: unknown) => void) => {
      ipcRenderer.on('update:available', (_e, info) => listener(info));
    },
    onDownloaded: (listener: (info: unknown) => void) => {
      ipcRenderer.on('update:downloaded', (_e, info) => listener(info));
    },
    onNotAvailable: (listener: () => void) => {
      ipcRenderer.on('update:not-available', () => listener());
    },
    onError: (listener: (message: string) => void) => {
      ipcRenderer.on('update:error', (_e, message) => listener(message));
    },
  },
  ai: {
    init: (type: 'openai' | 'local', apiKey?: string) =>
      ipcRenderer.invoke('ai:init', type, apiKey),
    summarize: (paperId: string) => ipcRenderer.invoke('ai:summarize', paperId),
    question: (question: string, paperId?: string) =>
      ipcRenderer.invoke('ai:question', question, paperId),
    related: (query: string) => ipcRenderer.invoke('ai:related', query),
    usage: () => ipcRenderer.invoke('ai:usage'),
    chat: {
      start: (params: unknown) => ipcRenderer.invoke('ai:chat:start', params),
      stop: (chatId: string) => ipcRenderer.invoke('ai:chat:stop', chatId),
      onChunk: (listener: (payload: { chatId: string; delta: string }) => void) => {
        ipcRenderer.on('ai:chat:chunk', (_e, payload) => listener(payload));
      },
      onDone: (listener: (payload: { chatId: string }) => void) => {
        ipcRenderer.on('ai:chat:done', (_e, payload) => listener(payload));
      },
      onError: (listener: (payload: { chatId: string; error: string }) => void) => {
        ipcRenderer.on('ai:chat:error', (_e, payload) => listener(payload));
      },
    },
  },
  license: {
    set: (pro: boolean) => ipcRenderer.invoke('license:set', pro),
    get: () => ipcRenderer.invoke('license:get'),
  },
  localAI: {
    start: (cfg: unknown) => ipcRenderer.invoke('local-ai:start', cfg),
    stop: () => ipcRenderer.invoke('local-ai:stop'),
    status: () => ipcRenderer.invoke('local-ai:status'),
    downloadModel: (payload: { url: string; destDir: string }) =>
      ipcRenderer.invoke('local-ai:download-model', payload),
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
