const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

if (process.platform === 'linux') {
  // X11 evita menús/popups que se cierran solos en Wayland.
  app.commandLine.appendSwitch('ozone-platform', 'x11');
  // Electron 42 puede crashear el proceso GPU (exit 139) en algunos drivers Linux.
  app.disableHardwareAcceleration();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || 'http://127.0.0.1:5173';
  mainWindow.loadURL(startUrl);
  mainWindow.setMenuBarVisibility(false);
}

function registerMenuBarToggle() {
  globalShortcut.register('Alt+M', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    win.setMenuBarVisibility(!win.isMenuBarVisible());
  });
}

app.whenReady().then(() => {
  registerMenuBarToggle();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
