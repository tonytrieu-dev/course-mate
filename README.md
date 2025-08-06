# ScheduleBud

![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue) ![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-blue)

A comprehensive student productivity application designed to streamline academic workflow management. Features intelligent calendar integration, AI-powered task generation, Canvas LMS synchronization, and cross-platform compatibility - completely free for educational use.

> 🎓 **Built by students, for students** - Designed to eliminate the complexity of academic organization while maintaining powerful functionality.

## ✨ Key Features

### 📅 **Smart Calendar System**
- Interactive calendar with month/week/day views
- Drag-and-drop task management
- Canvas LMS integration with automatic task import
- ICS calendar feed parsing with malformed data correction
- Academic quarter and semester system support

### 🤖 **AI-Powered Academic Assistant**
- PDF syllabus parsing and automatic task generation
- Google Gemini-powered chatbot for academic queries
- Smart course detection and automatic class assignment
- Context-aware responses based on uploaded materials

### 🎯 **Advanced Task Management**
- Customizable task types with color coding
- Priority-based organization and filtering
- Advanced search with academic presets
- Bulk operations and semester archiving
- Cross-device synchronization via Supabase

### 📊 **Grade & Analytics Dashboard**
- GPA calculation for quarters and semesters
- Grade trend analysis and performance insights
- Study session tracking with effectiveness ratings
- Workload analysis and schedule optimization

### 🔧 **Modern Development Stack**
- React 18 + TypeScript for type safety
- Tailwind CSS with dark/light mode support
- Supabase backend with real-time sync
- Webpack bundling with performance optimization
- Jest + Playwright testing suite

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager
- Supabase account (for backend services)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd schedulebud
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Development Server**
   ```bash
   npm start              # Start development server
   npm run typecheck      # TypeScript type checking
   npm run lint           # ESLint code quality check
   ```

5. **Production Build**
   ```bash
   npm run build          # Production build
   npm run analyze        # Bundle analysis
   ```

## 🔧 Development

### Project Architecture

```
src/
├── components/           # React components
│   ├── landing/         # Landing page components  
│   ├── calendar/        # Calendar system components
│   ├── settings/        # Settings management
│   ├── sidebar/         # Sidebar components
│   └── ui/             # Reusable UI components
├── contexts/            # React context providers
│   ├── AuthContext.tsx        # Authentication state
│   ├── SubscriptionContext.tsx # Subscription management
│   ├── ThemeContext.tsx       # Dark/light mode
│   └── TextFormattingContext.tsx # Text formatting
├── services/            # Business logic and API services
│   ├── class/          # Class management operations
│   ├── task/           # Task CRUD operations
│   ├── grade/          # Grade tracking and GPA
│   └── settings/       # Settings operations
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
└── index.tsx           # Application entry point
```

### Core Services

- **dataService**: Centralized CRUD operations with Supabase
- **authService**: Authentication and user management
- **canvasService**: Canvas LMS integration and ICS parsing
- **syncService**: Real-time data synchronization
- **studySessionService**: Study tracking and analytics

### Development Scripts

```bash
npm start              # Development server with hot reload
npm test               # Run Jest unit tests
npm run e2e            # Run Playwright E2E tests
npm run lint           # ESLint code quality check
npm run typecheck      # TypeScript type validation
npm run build          # Production build
npm run analyze        # Bundle size analysis
```

## 🔒 Security & Privacy

- **Secure Authentication**: Supabase-powered auth with email verification
- **API Key Protection**: Server-side AI processing to protect API keys
- **Input Validation**: Comprehensive sanitization for all user inputs
- **FERPA Compliance**: Privacy policy designed for educational use
- **Data Encryption**: All data encrypted in transit and at rest
- **CORS Security**: Multi-layer proxy system for Canvas integration

## 📱 Usage Guide

### Getting Started
1. **Create Account**: Sign up with email and verify your account
2. **Setup Profile**: Configure academic system (quarters/semesters)
3. **Add Classes**: Create classes or import from Canvas
4. **Canvas Integration**: Connect Canvas ICS feed for automatic task import
5. **Smart Upload**: Upload PDF syllabi for AI-powered task generation

### Core Workflows
- **Task Management**: Create, edit, and organize academic tasks
- **Calendar Views**: Switch between month, week, and day views
- **Grade Tracking**: Input grades and monitor GPA trends
- **Study Sessions**: Track study time and effectiveness
- **AI Assistant**: Chat with AI about uploaded course materials

## 🧪 Testing

The application includes comprehensive testing:

```bash
npm test               # Unit tests with Jest
npm run e2e           # End-to-end tests with Playwright
npm run e2e:ui        # Interactive test debugging
```

### Test Coverage
- ✅ **Authentication**: Complete sign-up/login flow
- ✅ **Calendar Operations**: Task creation, editing, deletion  
- ✅ **Canvas Integration**: ICS parsing and task import
- ✅ **AI Features**: PDF processing and chatbot responses
- ✅ **Cross-Browser**: Chrome, Firefox, Safari, Edge compatibility

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript 5.8** - Type safety and enhanced developer experience  
- **Tailwind CSS** - Utility-first styling with custom design system
- **React Router 7** - Client-side routing and navigation

### Backend & Services  
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Google Gemini AI** - Advanced language model for academic assistance
- **Supabase Edge Functions** - Serverless functions for AI processing

### Build & Development
- **Webpack 5** - Module bundling with optimization
- **Babel** - JavaScript compilation and polyfills
- **Jest + Playwright** - Unit and end-to-end testing
- **ESLint + Prettier** - Code quality and formatting

### Integrations
- **Canvas LMS** - ICS calendar parsing and task import
- **PDF.js** - Client-side PDF text extraction
- **ical.js** - Calendar format parsing and processing

## 🤝 Contributing

We welcome contributions from the academic community! Here's how you can help:

### Getting Involved
1. **Fork the repository** and create your feature branch
2. **Follow TypeScript** conventions and existing code patterns  
3. **Write tests** for new functionality using Jest/Playwright
4. **Run quality checks** with `npm run lint` and `npm run typecheck`
5. **Submit pull requests** with clear descriptions

### Areas for Contribution
- 🐛 **Bug fixes** - Improve stability and user experience
- ✨ **Feature development** - Enhance academic productivity tools
- 📚 **Documentation** - Help other students get started
- 🧪 **Testing** - Expand test coverage and edge cases
- 🌐 **Accessibility** - Improve WCAG compliance and usability

## 📄 License

**Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).

### What this means:

✅ **You CAN:**
- Use this software for personal, educational, or research purposes
- Share and redistribute the software
- Modify and build upon the software
- Use it in educational institutions and non-profit organizations

❌ **You CANNOT:**
- Use this software for commercial purposes or monetary gain
- Sell the software or any derivative works
- Use it in commercial applications or business environments
- Monetize any part of this codebase

### License Summary:
- **Attribution**: You must give appropriate credit and indicate if changes were made
- **NonCommercial**: You may not use the material for commercial purposes
- **ShareAlike**: If you remix or build upon the material, you must distribute under the same license

This software was created to provide free educational tools for students and other busy people. If you want to use this software commercially, please contact the author for a separate commercial license.

For the full license text, visit: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode

---

*Made with ❤️ for the educational community*
