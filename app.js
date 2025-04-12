const { app, BrowserWindow } = require('electron');
const path = require('path');

// Add hot reload in development
try {
  if (process.env.NODE_ENV === 'development') {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true
    });
  }
} catch (_) { console.log('Error'); }

function createWindow() {
    const win = new BrowserWindow({
        width: 400,
        height: 800,
        x: 1400,
        y: 100,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        resizable: true,
        minWidth: 300, // Minimum width
        minHeight: 400, // Minimum height
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });

  win.loadFile('index.html');
  
  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
