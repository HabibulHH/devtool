// Import utilities and functionality from other modules
import { 
  ready, 
  loadSettings, 
  toggleTheme, 
  toggleSettings, 
  togglePin, 
  minimizeWindow, 
  toggleMaximize, 
  showShortcutHint,
  saveSettings,
  setTheme,
  togglePasswordVisibility,
  updateTempValue,
  initWindowControls
} from './utils.js';

import { 
  loadSessions, 
  toggleSessionsPanel, 
  startNewSession, 
  handleKeyDown,
  updateSessionTitle
} from './sessions.js';

import { 
  updateTerminal,
  clearTerminal,
  handleTerminalKeyDown
} from './terminal.js';

// --- TAB FUNCTIONALITY ---
function switchTab(tabName) {
  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.tab-button').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content and mark tab as active
  document.getElementById(`${tabName}Content`).style.display = 'flex';
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  // If switching to terminal tab, remove the notification indicator
  if (tabName === 'terminal') {
    document.getElementById('terminalTab').classList.remove('has-suggestions');
  }
  
  // Focus input on the active tab
  if (tabName === 'chat') {
    setTimeout(() => document.getElementById('chatInput').focus(), 100);
  } else if (tabName === 'terminal') {
    setTimeout(() => document.getElementById('terminalInput').focus(), 100);
  }
}

// Export switchTab for use in other modules
export { switchTab };

// --- KEYBOARD SHORTCUTS ---
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Don't trigger shortcuts when typing in text areas or inputs
    if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
      return;
    }
    
    // Alt+P: Pin/unpin window
    if (event.altKey && event.key === 'p') {
      event.preventDefault();
      togglePin();
      showShortcutHint("Toggle pin: Alt+P");
    }
    
    // Alt+M: Minimize window
    if (event.altKey && event.key === 'm') {
      event.preventDefault();
      minimizeWindow();
      showShortcutHint("Minimize: Alt+M");
    }
    
    // Alt+X: Maximize/restore window
    if (event.altKey && event.key === 'x') {
      event.preventDefault();
      toggleMaximize();
      showShortcutHint("Maximize/Restore: Alt+X");
    }
    
    // Alt+N: New session
    if (event.altKey && event.key === 'n') {
      event.preventDefault();
      startNewSession();
      showShortcutHint("New session: Alt+N");
    }
    
    // Alt+H: Toggle history panel
    if (event.altKey && event.key === 'h') {
      event.preventDefault();
      toggleSessionsPanel();
      showShortcutHint("History panel: Alt+H");
    }
    
    // Alt+S: Toggle settings panel
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      toggleSettings();
      showShortcutHint("Settings: Alt+S");
    }
    
    // Alt+T: Toggle theme
    if (event.altKey && event.key === 't') {
      event.preventDefault();
      toggleTheme();
      showShortcutHint("Toggle theme: Alt+T");
    }
  });
}

// --- INITIALIZATION ---
// Make switchTab globally available for HTML onclick handlers
window.switchTab = switchTab;

// Initialize the application
ready(() => {
  try {
    loadSettings();
    loadSessions();
    setupKeyboardShortcuts();
    initWindowControls(); // Initialize window dragging and resizing
    
    const textarea = document.getElementById('chatInput');
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
      });
    }
    
    // Initialize terminal
    updateTerminal();
    
    // Add tab switching shortcuts
    document.addEventListener('keydown', (event) => {
      // Don't trigger shortcuts when typing in text areas or inputs
      if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
        return;
      }
      
      // Alt+1: Switch to Chat tab
      if (event.altKey && event.key === '1') {
        event.preventDefault();
        switchTab('chat');
        showShortcutHint("Switched to Chat: Alt+1");
      }
      
      // Alt+2: Switch to Terminal tab
      if (event.altKey && event.key === '2') {
        event.preventDefault();
        switchTab('terminal');
        showShortcutHint("Switched to Terminal: Alt+2");
      }
    });
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// Expose functions needed by HTML inline event handlers
window.handleKeyDown = handleKeyDown;
window.toggleSessionsPanel = toggleSessionsPanel;
window.toggleSettings = toggleSettings;
window.toggleTheme = toggleTheme;
window.startNewSession = startNewSession;
window.minimizeWindow = minimizeWindow;
window.toggleMaximize = toggleMaximize;
window.togglePin = togglePin;
window.updateSessionTitle = updateSessionTitle;
window.saveSettings = saveSettings;
window.setTheme = setTheme;
window.togglePasswordVisibility = togglePasswordVisibility;
window.updateTempValue = updateTempValue;
window.updateTerminal = updateTerminal;
window.clearTerminal = clearTerminal;
window.handleTerminalKeyDown = handleTerminalKeyDown; 