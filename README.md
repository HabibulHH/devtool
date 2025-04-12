# DevOps Sticky Helper

A desktop application designed to assist DevOps professionals with a chat interface powered by AI and a simulated terminal for quick commands.

## Features

- **Chat Assistant**: Interact with AI to get help with DevOps tasks, debug issues, and analyze logs
- **Terminal Simulator**: Quick access to commonly used DevOps commands
- **Frameless Window**: Custom window controls with repositioning and resizing
- **Session Management**: Save and restore your chat sessions
- **Themes**: Light and dark mode support
- **Settings**: Configure API keys and application preferences
- **Keyboard Shortcuts**: Efficient navigation and control

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/devops-sticky-helper.git
cd devops-sticky-helper
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Run the application

```bash
npm start
# or
yarn start
```

### Building for Production

Build for your platform:

```bash
npm run build
```

Or specify a platform:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## Keyboard Shortcuts

- **Alt+P**: Pin/unpin window (always on top)
- **Alt+M**: Minimize window
- **Alt+X**: Maximize/restore window
- **Alt+N**: New session
- **Alt+H**: Toggle history panel
- **Alt+S**: Toggle settings panel
- **Alt+T**: Toggle theme
- **Alt+1**: Switch to Chat tab
- **Alt+2**: Switch to Terminal tab

## Project Structure

```
devops-sticky-helper/
├── main.js           # Electron main process
├── preload.js        # Preload script for IPC
├── renderer-main.js  # Renderer process entry point
├── utils.js          # Utility functions
├── sessions.js       # Session management
├── terminal.js       # Terminal simulator
├── index.html        # Main HTML file
└── styles.css        # Styles
```

## Configuration

Add your API keys in the settings panel to enable the AI chat functionality.

## License

MIT
