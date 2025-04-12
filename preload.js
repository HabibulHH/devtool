const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing all of electron's APIs
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Window controls
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    toggleMaximize: () => ipcRenderer.send('toggle-maximize-window'),
    toggleAlwaysOnTop: (flag) => ipcRenderer.send('toggle-always-on-top', flag),
    
    // Window dragging and resizing
    startDrag: () => ipcRenderer.send('start-window-drag'),
    moveDrag: (deltaX, deltaY) => ipcRenderer.send('move-window-drag', deltaX, deltaY),
    getWindowSize: () => ipcRenderer.invoke('get-window-size'),
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
    
    // File operations
    saveToFile: (data) => ipcRenderer.invoke('save-to-file', data),
    loadFromFile: () => ipcRenderer.invoke('load-from-file'),
    
    // Terminal operations
    executeTerminalCommand: (command) => ipcRenderer.invoke('execute-terminal-command', command)
  }
); 