# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

锤子 (Hammer) is an Electron-based bilibili livestream assistant application that provides:
- **弹幕机** (Danmaku/Chat): Chat overlay integration with LAPLACE Chat
- **控制台** (Control Panel): Integrated LAPLACE console with broadcast features
- **点歌机** (Song Request): Music player with multi-source search and danmaku-driven song requests
- **设置** (Settings): Version management and configuration options

## Development Commands

### Basic Development
```bash
# Start development server
npm run start

# Build for production
npm run package

# Create distributable packages
npm run make

# Publish to GitHub releases
npm run publish
```

### Code Quality
```bash
# Run linting
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## Architecture Overview

### Electron Structure
- **Main Process**: `src/main/main.ts` - Application lifecycle, window management, IPC handlers
- **Renderer Process**: `src/renderer/` - React-based UI components
- **Preload Scripts**: `src/main/preload.ts` - Secure IPC bridge between main and renderer
- **Chat Overlay**: `chat-overlay/` - Separate overlay window for danmaku display

### Key Components Architecture

#### State Management (Zustand)
- `src/renderer/store/settingStore.ts` - Global settings, theme, OBS config, blacklist
- `src/renderer/store/songStore.ts` - Song queue, default playlist, music state
- `src/renderer/store/userStore.ts` - User authentication and bilibili account data

#### Core Services
- `src/renderer/services/musicApi.ts` - Multi-source music search (NetEase, Kuwo, Tidal, Joox)
- `src/renderer/services/obsWebSocket.ts` - OBS Studio integration for live streaming
- `src/renderer/services/bilibiliApi.ts` - Bilibili API interactions
- `src/main/websocket.ts` - WebSocket server for LAPLACE event bridge

#### Main UI Pages
- `src/renderer/pages/DanmakuViewer.tsx` - Danmaku configuration and OBS link generation
- `src/renderer/pages/SongRequest.tsx` - Music player, song search, and danmaku song requests
- `src/renderer/pages/ControlPanel.tsx` - LAPLACE console integration
- `src/renderer/pages/Settings.tsx` - App settings and version management

### Build Configuration
- **Electron Forge**: Main build tool with Vite plugin
- **Multiple Vite Configs**: Separate configs for main, renderer, and preload processes
- **Platform Support**: Windows (Squirrel installer), with configuration for other platforms

## Important Development Notes

### IPC Communication
- Main process handles window management, file operations, and OS integration
- Renderer uses exposed APIs via preload script for secure communication
- Chat overlay has its own preload script for isolated functionality

### Music Integration
- Song data flows through multiple APIs via GD音乐台 (music.gdstudio.xyz)
- APlayer library handles actual music playback with custom controls
- OBS integration updates text sources with current playing information

### Live Streaming Features
- WebSocket server (port 9696) bridges LAPLACE Chat events to the application
- Danmaku parsing supports configurable prefixes for different music sources
- Blacklist system filters inappropriate song requests and users

### Window Management
- Main window with tabs for different features
- Chat overlay window for streamers (transparent, always on top)
- Window state persistence and content protection options

## Configuration Files

### Key Config Files
- `forge.config.ts` - Electron Forge build configuration
- `vite.*.config.ts` - Vite build configurations for different processes
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

### Runtime Configuration
- Settings are persisted via Zustand middleware
- OBS connection settings: localhost:4455 (default)
- Music API endpoints configured in musicApi.ts

## Testing and Debugging

### Development Tools
- F12: Toggle DevTools
- F5: Reload current window
- Alt+Left: Navigate back

### Common Issues
- Music playback requires valid API responses from music.gdstudio.xyz
- OBS integration requires WebSocket server to be enabled in OBS Studio
- Danmaku connection depends on LAPLACE Chat server availability

## Security Considerations

- Content protection features prevent OBS screen capture when enabled
- Cookie handling for bilibili authentication with proper domain isolation
- WebSocket authentication tokens for LAPLACE bridge connections
- Input sanitization for song search queries and danmaku messages

## External Dependencies

### Key Libraries
- **Electron**: Desktop app framework
- **React + TypeScript**: UI framework
- **Radix UI**: Component library and theming
- **Zustand**: State management
- **APlayer**: Music player component
- **obs-websocket-js**: OBS Studio integration
- **LAPLACE Event Bridge SDK**: Live streaming chat integration

### API Services
- **GD音乐台**: Music search and streaming
- **Bilibili API**: User authentication and live streaming data
- **GitHub API**: Version checking and updates