const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const dataFilePath = path.join(app.getPath('userData'), 'data.json');

let mainWindow;
let dragStart = { x: 0, y: 0 };

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Frameless window for custom title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Handle IPC messages from renderer
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });
  
  ipcMain.on('toggle-maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  
  ipcMain.on('toggle-always-on-top', (event, flag) => {
    mainWindow.setAlwaysOnTop(flag);
  });
  
  // Window dragging and positioning
  ipcMain.on('start-window-drag', () => {
    const windowPosition = mainWindow.getPosition();
    dragStart = { x: windowPosition[0], y: windowPosition[1] };
  });
  
  ipcMain.on('move-window-drag', (event, deltaX, deltaY) => {
    mainWindow.setPosition(dragStart.x + deltaX, dragStart.y + deltaY);
  });
  
  // Window resizing
  ipcMain.handle('get-window-size', () => {
    const size = mainWindow.getSize();
    return { width: size[0], height: size[1] };
  });
  
  ipcMain.on('resize-window', (event, width, height) => {
    // Add minimum size constraint to prevent too small windows
    const minWidth = 400;
    const minHeight = 300;
    
    width = Math.max(width, minWidth);
    height = Math.max(height, minHeight);
    
    mainWindow.setSize(width, height);
  });
  
  // Terminal command execution
  ipcMain.handle('execute-terminal-command', async (event, command) => {
    // Security check - restrict certain dangerous commands
    const restrictedCommands = [
      'rm -rf', 'format', 'mkfs', 'dd', 'shutdown', 'reboot',
      'halt', 'poweroff', ':(){', 'chmod 777 /', '> /dev/sda'
    ];
    
    // Check if command contains any restricted patterns
    const isRestricted = restrictedCommands.some(restricted => 
      command.toLowerCase().includes(restricted.toLowerCase()));
    
    if (isRestricted) {
      return Promise.reject({ message: 'This command is restricted for security reasons.' });
    }
    
    return new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          reject({ message: stderr || error.message });
          return;
        }
        
        resolve(stdout || 'Command executed successfully.');
      });
    });
  });
  
  // File operations
  ipcMain.handle('save-to-file', async (event, data) => {
    try {
      await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Failed to save data:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('load-from-file', async () => {
    try {
      if (fs.existsSync(dataFilePath)) {
        const data = await fs.promises.readFile(dataFilePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      return { success: false, error: error.message };
    }
  });
}

app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 