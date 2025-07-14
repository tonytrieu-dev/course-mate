# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Notion-inspired application built as a React + Electron desktop app with calendar functionality, file management, and AI-powered chat features. The app uses Supabase for backend services including authentication, data storage, and AI functions.

## Development Commands

```bash
# Start webpack dev server (for browser development)
npm start

# Run Electron app (loads from localhost:8080)
npm run electron
```

The app runs on port 8080 via webpack-dev-server. The Electron app waits for the dev server to be ready before loading.

## Architecture

### Frontend Structure
- **React SPA** with React Router for navigation
- **Main Components:**
  - `App.jsx` - Root component with authentication wrapper
  - `Sidebar.jsx` - Navigation and AI chat interface
  - `SimpleCalendar.jsx` - Calendar view with task management
  - `LoginComponent.jsx` - Authentication UI
  - `CanvasSettings.jsx` - File/canvas management

### Authentication & Data Flow
- **AuthContext** (`src/contexts/AuthContext.jsx`) manages global auth state
- **Supabase** integration for user authentication
- **Local Storage** for offline data with sync capabilities
- **Data Services** pattern:
  - `authService.js` - Authentication operations
  - `dataService.js` - Local data management
  - `syncService.js` - Supabase sync operations
  - `canvasService.js` - File/canvas operations

### Backend (Supabase Functions)
- **Edge Functions** in TypeScript (Deno runtime):
  - `ask-chatbot/` - AI chat with RAG using HuggingFace embeddings
  - `embed-file/` - Document embedding for semantic search

## Configuration

### Environment Setup
1. Copy `config.example.js` to `config.js`
2. Update Supabase URL and API key in `config.js`
3. Configure Supabase project with required tables and functions

### Key Technologies
- **Frontend:** React 18, React Router 7, TailwindCSS 4, Webpack 5
- **Desktop:** Electron 35
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **AI:** HuggingFace embeddings, vector similarity search

## Development Notes

### Electron Integration
- Electron main process in `main.js` waits for webpack dev server
- Uses `nodeIntegration: true` and `contextIsolation: false` (development setup)

### State Management
- React Context for auth state
- Local storage with Supabase sync for data persistence
- Real-time sync triggers on auth state changes

### File Processing
- PDF and text file upload/processing
- Document embedding for semantic search via AI chat
- Canvas/workspace concept for organizing files

## Supabase Setup Requirements
- User authentication tables
- Document storage and embedding tables
- RPC function `match_documents` for vector similarity search
- Edge functions deployed for AI chat and file embedding