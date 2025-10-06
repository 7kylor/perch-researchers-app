import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { PDFReaderWindowManager } from './pdf-reader-window';
import { PDFImportManager } from './ingest/pdf-import';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    titleBarStyle: 'hiddenInset',
  });

  const devServerUrl = process.env['VITE_DEV_SERVER_URL'];
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, the compiled renderer is at dist/renderer next to dist/main
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  // Initialize PDF managers
  const pdfReaderManager = PDFReaderWindowManager.getInstance();
  const pdfImportManager = PDFImportManager.getInstance();

  // Setup IPC handlers
  pdfReaderManager.setupIPCHandlers();

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:version', () => app.getVersion());
