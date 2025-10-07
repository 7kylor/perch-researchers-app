import { BrowserWindow, app, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import type { Paper } from '../shared/types';

interface PDFReaderWindow extends BrowserWindow {
  paperId?: string;
}

export class PDFReaderWindowManager {
  private static instance: PDFReaderWindowManager;
  private windows = new Map<string, PDFReaderWindow>();
  private nextWindowId = 1;

  static getInstance(): PDFReaderWindowManager {
    if (!PDFReaderWindowManager.instance) {
      PDFReaderWindowManager.instance = new PDFReaderWindowManager();
    }
    return PDFReaderWindowManager.instance;
  }

  createWindow(paper: Paper): string {
    console.log('createWindow called with paper:', {
      id: paper.id,
      title: paper.title,
      filePath: paper.filePath,
      hasFilePath: !!paper.filePath,
      authors: paper.authors,
      status: paper.status,
    });

    const windowId = `pdf-reader-${this.nextWindowId++}`;

    // Create the browser window
    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      backgroundColor: '#1a1a1a',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        sandbox: false,
        nodeIntegration: false,
        webSecurity: true,
        additionalArguments: ['--pdf-reader-window'],
      },
      titleBarStyle: 'hiddenInset',
      show: false, // Don't show until ready
    }) as PDFReaderWindow;

    // Store the paper ID for this window
    window.paperId = paper.id;

    // Load the PDF reader HTML
    const isDev = process.env['VITE_DEV_SERVER_URL'];
    if (isDev) {
      // In development, load from the dev server at the root level
      window.loadURL(`${process.env['VITE_DEV_SERVER_URL']}/pdf-reader.html`);
      window.webContents.openDevTools({ mode: 'detach' });
    } else {
      // In production, load from the built files
      window.loadFile(path.join(__dirname, '../renderer/pdf-reader.html'));
    }

    // Handle window events
    window.once('ready-to-show', () => {
      window.show();
      window.focus();

      // Send the paper data to the window
      console.log('Sending paper data to PDF reader window:', {
        id: paper.id,
        title: paper.title,
        filePath: paper.filePath,
        hasFilePath: !!paper.filePath,
        authors: paper.authors,
        status: paper.status,
      });

      // Create a simple, serializable paper object
      const simplePaperData = {
        id: paper.id,
        title: paper.title || 'Untitled Paper',
        authors: paper.authors || [],
        filePath: paper.filePath || null,
        status: paper.status,
      };

      console.log('Sending simplified paper data:', simplePaperData);

      window.webContents.send('pdf-reader:paper-loaded', simplePaperData);
    });

    window.on('closed', () => {
      this.windows.delete(windowId);
    });

    // Handle external links
    window.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    this.windows.set(windowId, window);
    return windowId;
  }

  getWindow(windowId: string): PDFReaderWindow | undefined {
    return this.windows.get(windowId);
  }

  getWindowByPaperId(paperId: string): PDFReaderWindow | undefined {
    for (const window of this.windows.values()) {
      if (window.paperId === paperId) {
        return window;
      }
    }
    return undefined;
  }

  closeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId);
    if (window) {
      window.close();
      this.windows.delete(windowId);
      return true;
    }
    return false;
  }

  closeAllWindows(): void {
    for (const window of this.windows.values()) {
      window.close();
    }
    this.windows.clear();
  }

  getAllWindowIds(): string[] {
    return Array.from(this.windows.keys());
  }

  getWindowCount(): number {
    return this.windows.size;
  }

  // IPC handlers for PDF reader window management
  setupIPCHandlers(): void {
    // Create PDF reader window
    ipcMain.handle('pdf-reader:create-window', async (_event, paper: Paper) => {
      return this.createWindow(paper);
    });

    // Close PDF reader window
    ipcMain.handle('pdf-reader:close-window', async (_event, windowId: string) => {
      return this.closeWindow(windowId);
    });

    // Get PDF file path for a paper
    ipcMain.handle('pdf-reader:get-file-path', async (_event, paperId: string) => {
      console.log('Getting file path for paper:', paperId);
      // Import here to avoid circular dependency
      const { openDatabase } = await import('./db.js');
      const db = openDatabase();
      const row = db.prepare(`select * from papers where id = ?`).get(paperId) as {
        id: string;
        title: string;
        authors: string;
        venue?: string;
        year?: number;
        doi?: string;
        source?: string;
        abstract?: string;
        status: string;
        filePath?: string;
        textHash: string;
        addedAt: string;
        updatedAt: string;
      };
      console.log('Found file path:', row?.filePath);
      return row?.filePath || null;
    });

    // Check if PDF file exists
    ipcMain.handle('pdf-reader:file-exists', async (_event, filePath: string) => {
      console.log('Checking if file exists:', filePath);
      try {
        const exists = fs.existsSync(filePath);
        console.log('File exists:', exists);
        return exists;
      } catch (error) {
        console.error('Error checking file existence:', error);
        return false;
      }
    });

    // Get all active PDF reader windows
    ipcMain.handle('pdf-reader:get-windows', () => {
      return this.getAllWindowIds();
    });

    // Focus a specific PDF reader window
    ipcMain.handle('pdf-reader:focus-window', async (_event, windowId: string) => {
      const window = this.windows.get(windowId);
      if (window) {
        if (window.isMinimized()) {
          window.restore();
        }
        window.focus();
        return true;
      }
      return false;
    });
  }
}

// Clean up windows when app quits
app.on('before-quit', () => {
  const manager = PDFReaderWindowManager.getInstance();
  manager.closeAllWindows();
});
