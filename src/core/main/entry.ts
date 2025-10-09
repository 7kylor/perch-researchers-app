import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { PDFReaderWindowManager } from '../../main/pdf-reader-window';
import { PDFImportManager } from '../../main/ingest/pdf-import';

// ES modules: get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up IPC handlers early
const pdfReaderManager = PDFReaderWindowManager.getInstance();
const _pdfImportManager = PDFImportManager.getInstance();

pdfReaderManager.setupIPCHandlers();

// Auto-update setup
function setupAutoUpdater(): void {
  // Configure auto-updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false; // We'll handle restart manually

  // Check for updates on app start
  autoUpdater.checkForUpdatesAndNotify();

  // Update available
  autoUpdater.on('update-available', (info) => {
    const notification = new Notification({
      title: 'Update Available',
      body: `Version ${info.version} is available. Downloading...`,
      icon: path.join(__dirname, '../renderer/assets/icon.png'), // Adjust path as needed
      urgency: 'normal',
    });

    notification.show();

    // Send update info to renderer
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    const notification = new Notification({
      title: 'Update Downloaded',
      body: `Version ${info.version} downloaded. Restart to install.`,
      icon: path.join(__dirname, '../renderer/assets/icon.png'),
      urgency: 'normal',
      actions: [{ type: 'button', text: 'Restart Now' }],
    });

    notification.show();

    notification.on('action', () => {
      autoUpdater.quitAndInstall(false, true);
    });

    // Send update info to renderer
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  // Update not available
  autoUpdater.on('update-not-available', (_info) => {
    console.log('No updates available');
  });

  // Error
  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
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
ipcMain.handle('check-for-updates', async () => {
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

ipcMain.handle('download-update', async () => {
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

ipcMain.handle('quit-and-install', async () => {
  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});
