// Import utilities
import { safeSetValue, safeSetText, resizeTextarea } from './utils.js';
import { extractCommandsFromChatMessage, addSuggestedCommand, clearSuggestedCommands } from './terminal.js';
import { switchTab } from './renderer-main.js';

// Global variables for session management
let sessions = [];
let currentSessionId = null;

// --- SESSIONS MANAGEMENT ---
function loadSessions() {
  try {
    const savedSessions = localStorage.getItem('devops-helper-sessions');
    if (savedSessions) {
      sessions = JSON.parse(savedSessions);
      
      // If there's at least one session, load the most recent one
      if (sessions.length > 0) {
        const mostRecent = sessions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        loadSession(mostRecent.id);
      } else {
        startNewSession();
      }
    } else {
      startNewSession();
    }
    
    renderSessionsList();
  } catch (error) {
    console.error('Error loading sessions:', error);
    startNewSession();
  }
}

function saveSessions() {
  try {
    localStorage.setItem('devops-helper-sessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

function toggleSessionsPanel() {
  const panel = document.getElementById('sessionsPanel');
  panel.classList.toggle('open');
}

function startNewSession() {
  const newId = Date.now();
  const newSession = {
    id: newId,
    serial: sessions.length + 1,
    title: "Untitled Session",
    date: new Date().toISOString(),
    messages: [{
      role: "assistant",
      content: "Hello! I'm your DevOps Assistant. How can I help you today?"
    }]
  };
  
  sessions.push(newSession);
  currentSessionId = newId;
  
  // Update UI
  safeSetValue('sessionTitle', newSession.title);
  safeSetText('sessionId', `#${newSession.serial}`);
  
  saveSessions();
  
  // Clear chat
  const messagesContainer = document.getElementById('chatMessages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    addMessage("Hello! I'm your DevOps Assistant. How can I help you today?", 'assistant');
  }
  
  // Clear suggested commands
  clearSuggestedCommands();
}

function updateSessionTitle() {
  const titleInput = document.getElementById('sessionTitle');
  const newTitle = titleInput.value.trim() || "Untitled Session";
  
  const session = sessions.find(s => s.id === currentSessionId);
  if (session) {
    session.title = newTitle;
    saveSessions();
    renderSessionsList();
  }
}

function loadSession(sessionId) {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return;
  
  currentSessionId = sessionId;
  
  // Update session header
  safeSetValue('sessionTitle', session.title);
  safeSetText('sessionId', `#${session.serial}`);
  
  // Clear and reload messages
  const messagesContainer = document.getElementById('chatMessages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    
    session.messages.forEach(msg => {
      addMessage(msg.content, msg.role);
    });
  }
  
  // Update active state in list
  renderSessionsList();
  
  // Close sessions panel on mobile
  if (window.innerWidth < 768) {
    toggleSessionsPanel();
  }
  
  // Extract commands from the last assistant message
  const lastAssistantMessage = session.messages
    .filter(msg => msg.role === 'assistant')
    .pop();
    
  if (lastAssistantMessage) {
    const commands = extractCommandsFromChatMessage(lastAssistantMessage.content);
    commands.forEach(cmd => {
      addSuggestedCommand(cmd.command, cmd.explanation);
    });
  }
}

function renderSessionsList() {
  const list = document.getElementById('sessionsList');
  list.innerHTML = '';
  
  sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(session => {
    const sessionEl = document.createElement('div');
    sessionEl.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;
    sessionEl.onclick = () => loadSession(session.id);
    
    // Format date nicely
    const sessionDate = new Date(session.date);
    const formattedDate = sessionDate.toLocaleDateString() + ' ' + 
                         sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Get last question as preview
    let preview = "No messages yet";
    const userMessages = session.messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      preview = userMessages[userMessages.length - 1].content;
      if (preview.length > 60) {
        preview = preview.substring(0, 60) + '...';
      }
    }
    
    sessionEl.innerHTML = `
      <div class="session-item-header">
        <div class="session-item-title">${session.title}</div>
        <div class="session-item-id">#${session.serial}</div>
      </div>
      <div class="session-item-date">${formattedDate}</div>
      <div class="session-item-preview">${preview}</div>
    `;
    
    list.appendChild(sessionEl);
  });
}

// --- CHAT FUNCTIONALITY ---
function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // If no current session, create one
  if (!currentSessionId) {
    startNewSession();
  }
  
  // Add user message to chat
  addMessage(message, 'user');
  
  // Add to session storage
  const session = sessions.find(s => s.id === currentSessionId);
  if (session) {
    session.messages.push({
      role: 'user',
      content: message
    });
    session.date = new Date().toISOString(); // Update session date to now
    saveSessions();
    renderSessionsList();
  }
  
  input.value = '';
  resizeTextarea(input);
  
  // Show loading indicator
  document.getElementById('loadingIndicator').style.display = 'block';
  
  // If the message contains references to terminal or commands, make sure to show a "Run in Terminal" button
  if (message.toLowerCase().includes('terminal') || 
      message.toLowerCase().includes('command') || 
      message.toLowerCase().includes('bash') || 
      message.toLowerCase().includes('shell') || 
      message.toLowerCase().includes('script')) {
    // Add a notification to the terminal tab
    document.getElementById('terminalTab').classList.add('has-suggestions');
  }
  
  // Get settings
  const settings = JSON.parse(localStorage.getItem('devops-helper-settings') || '{}');
    
  if (!settings.openaiKey && !settings.claudeKey) {
    const response = "Please add either an OpenAI or Claude API key in settings to use the chat functionality.";
    addMessage(response, 'assistant');
    
    // Add response to session storage
    if (session) {
      session.messages.push({
        role: 'assistant',
        content: response
      });
      saveSessions();
    }
    
    document.getElementById('loadingIndicator').style.display = 'none';
    return;
  }
  
  // TODO: Implement actual API call to OpenAI or Claude
  // For now, we'll simulate a response after a delay
  setTimeout(() => {
    let randomResponse;
    
    // If the message includes words related to commands, provide command examples
    if (message.toLowerCase().includes('command') || 
        message.toLowerCase().includes('terminal') || 
        message.toLowerCase().includes('shell') ||
        message.toLowerCase().includes('bash') ||
        message.toLowerCase().includes('script') ||
        message.toLowerCase().includes('docker')) {
      
      randomResponse = `Here are some commands you might find useful:

\`\`\`bash
# List all running Docker containers
docker ps

# Check Kubernetes pod status
kubectl get pods

# View resource usage
top

# Check disk space
df -h
\`\`\`

You can run these commands directly from the terminal tab by clicking the run button.`;
    } else if (message.toLowerCase().includes('docker')) {
      randomResponse = `Sure, I can help you check if Docker is installed on your system. Here are the steps:

1. Open a terminal or command prompt window.
2. Run the following command to check if the Docker service is running:
   \`\`\`bash
   sudo systemctl status docker
   \`\`\`
   If Docker is installed and running, you should see output showing the current status of the Docker service.

3. To verify if the Docker client is installed, run:
   \`\`\`bash
   docker --version
   \`\`\`
   This should print the version of the Docker client if it's installed.

4. Additionally, you can try running a Docker command like:
   \`\`\`bash
   docker run hello-world
   \`\`\`
   This will attempt to pull and run the "hello-world" Docker image. If Docker is installed and configured properly, it should download the image and print a message.

If any of these commands fail or show that Docker is not installed, you'll need to install Docker first before proceeding.`;
    } else {
      const responses = [
        `I've analyzed your logs and found a potential issue with your Docker configuration.\n\nThe problem appears to be in your network settings. Try updating your Docker daemon.json file with the following configuration:\n\n\`\`\`json\n{\n  "dns": ["8.8.8.8", "8.8.4.4"],\n  "max-concurrent-downloads": 10,\n  "max-concurrent-uploads": 5\n}\n\`\`\`\n\nThis should help resolve the connectivity issues you're experiencing.`,
        
        `That Kubernetes command looks correct, but you might want to consider adding a namespace.\n\nInstead of:\n\`kubectl get pods\`\n\nTry using:\n\`kubectl get pods -n your-namespace\`\n\nThis will scope your query to a specific namespace and make it easier to find the pods you're looking for.`,
        
        `Here's a more efficient way to write that shell script:\n\n\`\`\`bash\n#!/bin/bash\n\n# Function to process files\nprocess_files() {\n  local dir=$1\n  \n  find "$dir" -type f -name "*.log" | while read file; do\n    echo "Processing $file..."\n    grep "ERROR" "$file" >> errors.log\n  done\n}\n\n# Main execution\nprocess_files "/var/log"\necho "Done!"\n\`\`\`\n\nThis version uses a function to improve readability and uses the find command more efficiently.`,
        
        `Your YAML appears to be valid, but there might be some indentation issues in line 8.\n\nHere's the corrected version:\n\n\`\`\`yaml\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\n  namespace: production\ndata:\n  DATABASE_URL: "postgresql://user:password@db:5432/app"\n  REDIS_HOST: "redis-master.default.svc.cluster.local"\n  LOG_LEVEL: "info"\n\`\`\`\n\nMake sure the indentation is consistent using spaces (not tabs) throughout your YAML files.`
      ];
      randomResponse = responses[Math.floor(Math.random() * responses.length)];
    }
    
    addMessage(randomResponse, 'assistant');
    
    // Extract commands from the response
    const commands = extractCommandsFromChatMessage(randomResponse);
    clearSuggestedCommands();
    commands.forEach(cmd => {
      addSuggestedCommand(cmd.command, cmd.explanation);
    });
    
    // Add response to session storage
    if (session) {
      session.messages.push({
        role: 'assistant',
        content: randomResponse
      });
      saveSessions();
    }
    
    document.getElementById('loadingIndicator').style.display = 'none';
  }, 1500);
}

function addMessage(text, sender) {
  const messagesContainer = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  if (sender === 'assistant') {
    // Format the assistant message with proper markdown rendering
    const formattedContent = document.createElement('div');
    formattedContent.className = 'formatted-content';
    
    // Replace code blocks with properly formatted HTML
    let processedText = text.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
      // Determine if there's a language specified
      const firstLineBreak = codeContent.indexOf('\n');
      let language = '';
      let actualCode = codeContent;
      
      if (firstLineBreak > 0 && firstLineBreak < 20) {
        language = codeContent.substring(0, firstLineBreak).trim();
        if (language) {
          actualCode = codeContent.substring(firstLineBreak + 1);
        }
      }
      
      // Apply basic syntax highlighting for bash/shell
      if (language === 'bash' || language === 'shell') {
        // Highlight comments
        actualCode = actualCode.replace(/(#.+)$/gm, '<span class="comment">$1</span>');
        
        // Highlight common commands
        const commands = ['docker', 'kubectl', 'sudo', 'apt', 'yum', 'grep', 'find', 'echo', 'cat', 'ls', 'cd', 'rm', 'mkdir', 'systemctl'];
        commands.forEach(cmd => {
          const regex = new RegExp(`\\b(${cmd})\\b`, 'g');
          actualCode = actualCode.replace(regex, '<span class="command">$1</span>');
        });
      }
      
      return `<pre class="code-block ${language ? `language-${language}` : ''}"><code>${actualCode}</code></pre>`;
    });
    
    // Convert inline code
    processedText = processedText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Convert line breaks
    processedText = processedText.replace(/\n/g, '<br>');
    
    // Handle lists
    processedText = processedText.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
    processedText = processedText.replace(/(<li>.+<\/li>)\s*(<li>.+<\/li>)/g, '<ul>$1$2</ul>');
    
    formattedContent.innerHTML = processedText;
    messageDiv.appendChild(formattedContent);
  } else {
    // User messages stay simple
    const content = document.createElement('p');
    content.textContent = text;
    messageDiv.appendChild(content);
  }
  
  // If it's an assistant message, check for commands and add a "Run in Terminal" button if found
  if (sender === 'assistant') {
    const commands = extractCommandsFromChatMessage(text);
    if (commands.length > 0) {
      const terminalButton = document.createElement('button');
      terminalButton.className = 'run-in-terminal-btn';
      
      // Display different text based on number of commands
      if (commands.length === 1) {
        terminalButton.textContent = 'Run Command in Terminal';
      } else {
        terminalButton.textContent = `Run ${commands.length} Commands in Terminal`;
      }
      
      terminalButton.onclick = () => {
        // Switch to terminal tab
        switchTab('terminal');
        
        // Get the suggested commands container
        const suggestedCommandsContainer = document.getElementById('suggestedCommands');
        
        // Check if there are any command buttons and click the first one after a short delay
        // This allows time for the tab to switch first
        setTimeout(() => {
          const runButtons = suggestedCommandsContainer.querySelectorAll('.run-command-btn');
          if (runButtons.length > 0) {
            runButtons[0].click();
          }
        }, 300);
      };
      messageDiv.appendChild(terminalButton);
    }
  }
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  } else if (event.key === 'Enter' && event.shiftKey) {
    // Allow shift+enter for new lines
  }
  
  // Resize textarea based on content
  resizeTextarea(event.target);
}

// Export all session and chat functions
export {
sessions,
currentSessionId,
loadSessions,
saveSessions,
toggleSessionsPanel,
startNewSession,
updateSessionTitle,
loadSession,
renderSessionsList,
sendMessage,
addMessage,
handleKeyDown
};