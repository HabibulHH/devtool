// --- DOM READY CHECK ---
function ready(callback) {
  // Check if document is already loaded
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// --- SAFE DOM ACCESS ---
function safeSetValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.value = value;
  } else {
    console.warn(`Element with ID ${elementId} not found`);
  }
}

function safeSetText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  } else {
    console.warn(`Element with ID ${elementId} not found`);
  }
}

// --- SETTINGS MANAGEMENT ---
function loadSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem('devops-helper-settings') || '{}');
    
    if (settings.openaiKey) safeSetValue('openai-key', settings.openaiKey);
    if (settings.azureKey) safeSetValue('azure-key', settings.azureKey);
    if (settings.claudeKey) safeSetValue('claude-key', settings.claudeKey);
    if (settings.model) safeSetValue('ai-model', settings.model);
    if (settings.temperature) {
      const tempElement = document.getElementById('temperature');
      const tempValueElement = document.getElementById('temp-value');
      if (tempElement) tempElement.value = settings.temperature;
      if (tempValueElement) tempValueElement.textContent = settings.temperature;
    }
    if (settings.theme) setTheme(settings.theme);
    
    // Load terminal execution permission setting
    const allowCommandExecution = document.getElementById('allow-command-execution');
    if (allowCommandExecution) {
      allowCommandExecution.checked = settings.allowCommandExecution || false;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    // Use defaults if settings can't be loaded
    setTheme('dark');
  }
}

function saveSettings() {
  try {
    const settings = {
      openaiKey: document.getElementById('openai-key')?.value,
      azureKey: document.getElementById('azure-key')?.value,
      claudeKey: document.getElementById('claude-key')?.value,
      model: document.getElementById('ai-model')?.value,
      temperature: document.getElementById('temperature')?.value,
      theme: document.documentElement.getAttribute('data-theme'),
      allowCommandExecution: document.getElementById('allow-command-execution')?.checked || false
    };
    
    localStorage.setItem('devops-helper-settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Add function to check if command execution is allowed
function isCommandExecutionAllowed() {
  try {
    const settings = JSON.parse(localStorage.getItem('devops-helper-settings') || '{}');
    return settings.allowCommandExecution || false;
  } catch (error) {
    console.error('Error checking command execution permission:', error);
    return false; // Default to not allowed for safety
  }
}

// --- THEME HANDLING ---
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  saveSettings();
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveSettings();
}

// --- SETTINGS PANEL ---
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('open');
}

function togglePasswordVisibility(button) {
  const input = button.previousElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🔒';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

function updateTempValue(value) {
  document.getElementById('temp-value').textContent = value;
  saveSettings();
}

// --- WINDOW CONTROLS ---
function minimizeWindow() {
  if (window.electronAPI) {
    window.electronAPI.minimizeWindow();
  } else {
    console.log("Minimize functionality requires Electron");
    showShortcutHint("Minimize requires desktop app integration");
  }
}

function toggleMaximize() {
  if (window.electronAPI) {
    window.electronAPI.toggleMaximize();
  } else {
    console.log("Maximize functionality requires Electron");
    showShortcutHint("Maximize requires desktop app integration");
  }
}

let isPinned = false;
function togglePin() {
  if (window.electronAPI) {
    isPinned = !isPinned;
    window.electronAPI.toggleAlwaysOnTop(isPinned);
    document.getElementById('pinButton').classList.toggle('active', isPinned);
  } else {
    console.log("Pin functionality requires Electron");
    showShortcutHint("Pin window requires desktop app integration");
  }
}

// --- WINDOW REPOSITIONING & RESIZING ---
function initWindowControls() {
  // Handle draggable title bar for window movement
  const titleBar = document.querySelector('.title-bar');
  let isDragging = false;
  let startX, startY;

  titleBar.addEventListener('mousedown', (e) => {
    // Only allow dragging on the title bar, not on its buttons
    if (e.target.closest('.title-bar-controls') || e.target.closest('.tabs')) {
      return;
    }
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    if (window.electronAPI) {
      window.electronAPI.startDrag();
    } else {
      showShortcutHint("Window dragging requires desktop app integration");
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    if (window.electronAPI) {
      window.electronAPI.moveDrag(deltaX, deltaY);
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Handle resize using the resize handle
  const resizeHandle = document.querySelector('.resize-handle');
  let isResizing = false;
  let startWidth, startHeight;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Get current window size
    if (window.electronAPI) {
      const size = window.electronAPI.getWindowSize();
      startWidth = size.width;
      startHeight = size.height;
    }
    
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    if (window.electronAPI) {
      window.electronAPI.resizeWindow(startWidth + deltaX, startHeight + deltaY);
    } else {
      showShortcutHint("Window resizing requires desktop app integration");
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });

  // Add hover effect to resize handle
  resizeHandle.addEventListener('mouseover', () => {
    document.body.style.cursor = 'nwse-resize';
  });
  
  resizeHandle.addEventListener('mouseout', () => {
    document.body.style.cursor = 'default';
  });
}

// Show shortcut hint with temporary tooltip
function showShortcutHint(text) {
  // Create a hint element if it doesn't exist
  let hintEl = document.getElementById('shortcutHint');
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.id = 'shortcutHint';
    hintEl.className = 'shortcut-hint';
    document.body.appendChild(hintEl);
  }
  
  hintEl.textContent = text;
  hintEl.classList.add('visible');
  
  // Hide the hint after 2 seconds
  setTimeout(() => {
    hintEl.classList.remove('visible');
  }, 2000);
}

// --- MISC UTILITY FUNCTIONS ---
function resizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Export all utility functions
export {
  ready,
  safeSetValue,
  safeSetText,
  loadSettings,
  saveSettings,
  toggleTheme,
  setTheme,
  toggleSettings,
  togglePasswordVisibility,
  updateTempValue,
  minimizeWindow,
  toggleMaximize, 
  togglePin,
  showShortcutHint,
  resizeTextarea,
  initWindowControls,
  isCommandExecutionAllowed
}; 