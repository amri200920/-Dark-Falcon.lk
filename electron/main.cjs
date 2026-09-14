// Dark Falcon 🦅 Desktop Architecture - Electron Main Process
const { app, BrowserWindow, ipcMain, Tray, Menu, shell, globalShortcut } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#06080d',
    title: 'Dark Falcon 🦅',
    frame: true, // Native frameless or titlebar
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  const startUrl = isDev
    ? process.env.ELECTRON_START_URL || 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Intercept navigation to prevent external link takeovers
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('darkfalcon.app')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '../public/assets/brand/dark-falcon-logo.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Dark Falcon 🦅',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'TV Experience 📺',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.executeJavaScript("window.location.hash = 'tv';");
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Lock Application 🔒',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('dark-falcon:trigger-lock');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Dark Falcon',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('Dark Falcon 🦅 — Connect. Create. Communicate.');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('System tray initialization deferred:', err.message);
  }
}

// IPC Handlers
ipcMain.handle('dark-falcon:get-platform', () => process.platform);
ipcMain.handle('dark-falcon:get-app-version', () => app.getVersion());

ipcMain.on('dark-falcon:set-badge', (event, count) => {
  if (app.setBadgeCount) {
    app.setBadgeCount(count || 0);
  }
});

ipcMain.on('dark-falcon:window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('dark-falcon:window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('dark-falcon:window-close', () => {
  if (mainWindow) mainWindow.close();
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Register Global Hotkey for Immediate App Lock
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (mainWindow) {
      mainWindow.webContents.send('dark-falcon:trigger-lock');
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
