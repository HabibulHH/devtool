// Import utilities
import { isCommandExecutionAllowed } from './utils.js';

// Global terminal variables
let commandHistory = [];
let historyIndex = -1;
let currentDirectory = '/home/user';
let suggestedCommands = [];

// --- TERMINAL FUNCTIONALITY ---
function updateTerminal() {
  const terminalType = document.getElementById('terminalType').value;
  const prompt = document.getElementById('terminalPrompt');
  
  if (terminalType === 'bash') {
    prompt.textContent = `user@devops:~$`;
  } else if (terminalType === 'powershell') {
    prompt.textContent = `PS ${currentDirectory}>`; 
  } else if (terminalType === 'cmd') {
    prompt.textContent = `C:\\>${currentDirectory}>`; 
  }
}

function clearTerminal() {
  const output = document.getElementById('terminalOutput');
  output.innerHTML = `<div class="terminal-line">
    <span class="terminal-prompt">user@devops:~$</span>
    <span class="terminal-welcome">Terminal cleared. Ready for commands.</span>
  </div>`;
  
  // Also clear suggested commands
  clearSuggestedCommands();
}

function handleTerminalKeyDown(event) {
  const input = document.getElementById('terminalInput');
  
  // Handle command history navigation with up/down arrows
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      input.value = commandHistory[commandHistory.length - 1 - historyIndex];
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      input.value = commandHistory[commandHistory.length - 1 - historyIndex];
    } else if (historyIndex === 0) {
      historyIndex = -1;
      input.value = '';
    }
  }
  // Handle command execution with Enter
  else if (event.key === 'Enter') {
    event.preventDefault();
    const command = input.value.trim();
    
    if (command) {
      executeCommand(command);
      input.value = '';
      historyIndex = -1;
    }
  }
  // Tab completion (simple version)
  else if (event.key === 'Tab') {
    event.preventDefault();
    // Simple tab completion could be implemented here
  }
}

function executeCommand(command, isFromSuggestion = false) {
  // Add command to history
  commandHistory.push(command);
  if (commandHistory.length > 50) {
    commandHistory.shift(); // Remove oldest command if history gets too long
  }
  
  const output = document.getElementById('terminalOutput');
  const terminalType = document.getElementById('terminalType').value;
  const promptText = document.getElementById('terminalPrompt').textContent;
  
  // Add command to terminal
  const commandLine = document.createElement('div');
  commandLine.className = 'terminal-line';
  if (isFromSuggestion) {
    commandLine.innerHTML = `<span class="terminal-prompt">${promptText}</span><span class="suggested-command-executed">${command}</span>`;
  } else {
    commandLine.innerHTML = `<span class="terminal-prompt">${promptText}</span>${command}`;
  }
  output.appendChild(commandLine);
  
  // Check if real command execution is allowed
  const canExecuteRealCommands = isCommandExecutionAllowed();
  
  // Process command (simulated)
  let responseText = '';
  let responseClass = '';
  
  // Very basic command simulation - in a real app, you would send these to a backend
  if (command.startsWith('cd ')) {
    const dir = command.substring(3);
    currentDirectory = dir;
    responseText = `Changed directory to ${dir}`;
    responseClass = 'terminal-success';
    updateTerminal();
  }
  else if (command === 'ls' || command === 'dir') {
    responseText = 'file1.txt  file2.txt  folder1/  folder2/';
    responseClass = '';
  }
  else if (command === 'pwd') {
    responseText = currentDirectory;
    responseClass = '';
  }
  else if (command === 'clear' || command === 'cls') {
    clearTerminal();
    return;
  }
  else if (command.startsWith('echo ')) {
    responseText = command.substring(5);
    responseClass = '';
  }
  else if (command === 'help') {
    responseText = `Available commands:
cd <directory> - Change directory
ls, dir - List files and directories
pwd - Print working directory
clear, cls - Clear the terminal
echo <text> - Print text
help - Show this help message`;
    responseClass = 'terminal-welcome';
  }
  // For actual command execution via Electron/Node if allowed
  else if (canExecuteRealCommands && window.electronAPI && window.electronAPI.executeTerminalCommand) {
    // Show a message that we're executing the command
    const executingMsg = document.createElement('div');
    executingMsg.className = 'terminal-line';
    executingMsg.innerHTML = `<span class="terminal-info">Executing command, please wait...</span>`;
    output.appendChild(executingMsg);
    output.scrollTop = output.scrollHeight;
    
    // In a real app, this would execute the command via IPC
    window.electronAPI.executeTerminalCommand(command)
      .then(result => {
        // Remove executing message
        output.removeChild(executingMsg);
        
        // Add the result
        const responseLine = document.createElement('div');
        responseLine.className = 'terminal-line';
        
        // Format the result for better display
        const formattedResult = result
          .split('\n')
          .map(line => line.replace(/\s+$/, ''))  // Remove trailing whitespace
          .join('\n');
          
        // Create a pre element to preserve formatting
        const pre = document.createElement('pre');
        pre.className = 'terminal-output-text';
        pre.textContent = formattedResult;
        responseLine.appendChild(pre);
        
        output.appendChild(responseLine);
        output.scrollTop = output.scrollHeight;
      })
      .catch(error => {
        // Remove executing message
        output.removeChild(executingMsg);
        
        const responseLine = document.createElement('div');
        responseLine.className = 'terminal-line';
        responseLine.innerHTML = `<span class="terminal-error">${error.message}</span>`;
        output.appendChild(responseLine);
        output.scrollTop = output.scrollHeight;
      });
    return;
  }
  else {
    if (!canExecuteRealCommands && command.indexOf(' ') > 0) {
      // This is likely a real command that couldn't be executed
      responseText = `Command simulation: ${command}\nReal command execution is disabled. Enable it in settings to run real commands.`;
      responseClass = 'terminal-info';
    } else {
      responseText = `Command not found: ${command}`;
      responseClass = 'terminal-error';
    }
  }
  
  // Add response to terminal
  const responseLine = document.createElement('div');
  responseLine.className = 'terminal-line';
  if (responseClass) {
    responseLine.innerHTML = `<span class="${responseClass}">${responseText}</span>`;
  } else {
    responseLine.textContent = responseText;
  }
  output.appendChild(responseLine);
  
  // Scroll to bottom
  output.scrollTop = output.scrollHeight;
}

// --- SUGGESTED COMMANDS ---

function addSuggestedCommand(command, explanation) {
  suggestedCommands.push({ command, explanation });
  updateSuggestedCommandsDisplay();
  
  // Add notification to terminal tab if we're not currently on it
  const terminalTab = document.getElementById('terminalTab');
  const chatContent = document.getElementById('chatContent');
  
  // If the chat tab is visible, add notification to terminal tab
  if (chatContent && chatContent.style.display !== 'none') {
    terminalTab.classList.add('has-suggestions');
  }
}

function clearSuggestedCommands() {
  suggestedCommands = [];
  updateSuggestedCommandsDisplay();
}

function updateSuggestedCommandsDisplay() {
  const suggestedContainer = document.getElementById('suggestedCommands');
  if (!suggestedContainer) return;
  
  suggestedContainer.innerHTML = '';
  
  if (suggestedCommands.length === 0) {
    suggestedContainer.style.display = 'none';
    return;
  }
  
  suggestedContainer.style.display = 'block';
  
  // Add heading
  const heading = document.createElement('div');
  heading.className = 'suggested-heading';
  heading.textContent = 'Suggested Commands:';
  suggestedContainer.appendChild(heading);
  
  // Add each suggested command
  suggestedCommands.forEach(({ command, explanation }) => {
    const commandEl = document.createElement('div');
    commandEl.className = 'suggested-command';
    
    const commandText = document.createElement('div');
    commandText.className = 'suggested-command-text';
    commandText.textContent = command;
    
    const commandExplanation = document.createElement('div');
    commandExplanation.className = 'suggested-command-explanation';
    commandExplanation.textContent = explanation;
    
    const runButton = document.createElement('button');
    runButton.className = 'run-command-btn';
    runButton.innerHTML = '▶️';
    runButton.title = 'Run command';
    runButton.onclick = () => executeCommand(command, true);
    
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-command-btn';
    copyButton.innerHTML = '📋';
    copyButton.title = 'Copy to input';
    copyButton.onclick = () => {
      document.getElementById('terminalInput').value = command;
      document.getElementById('terminalInput').focus();
    };
    
    commandEl.appendChild(commandText);
    commandEl.appendChild(commandExplanation);
    commandEl.appendChild(copyButton);
    commandEl.appendChild(runButton);
    
    suggestedContainer.appendChild(commandEl);
  });
}

// Function to extract commands from chat messages
function extractCommandsFromChatMessage(message) {
  // Simple pattern for now: look for code blocks or lines starting with $
  const commandMatches = [];
  
  // Match code blocks with ```
  const codeBlockRegex = /```(?:bash|shell|sh|cmd|powershell)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(message)) !== null) {
    const codeBlock = match[1];
    // Split by lines and filter out empty lines
    const commands = codeBlock.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
      
    commands.forEach(cmd => {
      // Remove leading $ if present
      const cleanCmd = cmd.startsWith('$') ? cmd.substring(1).trim() : cmd;
      if (cleanCmd) {
        commandMatches.push({
          command: cleanCmd,
          explanation: 'Extracted from code block'
        });
      }
    });
  }
  
  // Match lines starting with $
  const dollarLineRegex = /^\$\s*(.+)$/gm;
  while ((match = dollarLineRegex.exec(message)) !== null) {
    commandMatches.push({
      command: match[1].trim(),
      explanation: 'Suggested command'
    });
  }
  
  return commandMatches;
}

// Export terminal functions
export {
  updateTerminal,
  clearTerminal,
  handleTerminalKeyDown,
  executeCommand,
  addSuggestedCommand,
  clearSuggestedCommands,
  extractCommandsFromChatMessage
}; 