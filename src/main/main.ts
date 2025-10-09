import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { PDFReaderWindowManager } from './pdf-reader-window.js';
import { PDFImportManager } from './ingest/pdf-import.js';
import { getSettings, updateSettings } from './settings.js';

// ES modules: get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up IPC handlers early
const pdfReaderManager = PDFReaderWindowManager.getInstance();
const _pdfImportManager = PDFImportManager.getInstance();

pdfReaderManager.setupIPCHandlers();

// Auto-update setup
function setupAutoUpdater(): void {
  const settings = getSettings();
  // Configure auto-updater
  autoUpdater.autoDownload = settings.autoUpdateEnabled;
  autoUpdater.autoInstallOnAppQuit = true; // install on quit automatically

  // Check for updates on app start if enabled
  if (settings.autoUpdateEnabled) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // Update available
  autoUpdater.on('update-available', (info) => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update:available', info);
    }
  });

  // Update downloaded -> notify user to restart
  autoUpdater.on('update-downloaded', (info) => {
    const notification = new Notification({
      title: 'Update ready',
      body: `Version ${info.version} downloaded. Restart to apply.`,
      urgency: 'normal',
    });
    notification.show();
    notification.on('click', () => {
      autoUpdater.quitAndInstall(false, true);
    });
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update:downloaded', info);
    }
  });

  // Update not available
  autoUpdater.on('update-not-available', (_info) => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update:not-available');
    }
  });

  // Error
  autoUpdater.on('error', (err) => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update:error', err instanceof Error ? err.message : String(err));
    }
  });
}

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
  createWindow();

  // Set up auto-updater after window is created
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:version', () => app.getVersion());

// Auto-update IPC handlers
ipcMain.handle('updates:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      success: true,
      updateInfo: result ? result.updateInfo : null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('updates:download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('updates:quit-and-install', async () => {
  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});

// Settings IPC
ipcMain.handle('settings:get', async () => {
  return getSettings();
});

ipcMain.handle('settings:set', async (_e, partial: Partial<ReturnType<typeof getSettings>>) => {
  const next = updateSettings(partial as { autoUpdateEnabled?: boolean });
  return next;
});
