# ScheduleBud

![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue) ![License](https://img.shields.io/badge/License-Proprietary-red)

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

## 🌐 Access ScheduleBud

**ScheduleBud is a web application** - simply visit the website to start managing your academic workflow.

### Getting Started
1. **Visit the Application** - Navigate to the ScheduleBud web application
2. **Create Account** - Sign up with your email address and verify your account  
3. **Setup Profile** - Configure your academic system (quarters/semesters)
4. **Add Classes** - Create classes or import from Canvas LMS
5. **Start Organizing** - Begin managing tasks, grades, and study sessions

### Browser Requirements
- **Modern Web Browser** - Chrome, Firefox, Safari, or Edge (latest versions)
- **JavaScript Enabled** - Required for full functionality
- **Stable Internet Connection** - For real-time synchronization

## 🔧 Technical Architecture

*The following information is provided for transparency about the technology stack and architecture.*

### Project Structure

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

### Quality Assurance

The application is maintained with comprehensive quality standards:

- **Unit Testing**: Jest framework for component and service testing
- **End-to-End Testing**: Playwright for full user workflow validation  
- **Type Safety**: TypeScript for compile-time error prevention
- **Code Quality**: ESLint and Prettier for consistent code standards
- **Performance Monitoring**: Bundle analysis and optimization tracking

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

## 🧪 Quality Validation

The application undergoes rigorous testing to ensure reliability and user experience:

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

## 🤝 Support & Feedback

This is proprietary software maintained exclusively by Tony Trieu. While code contributions are not accepted, your feedback is valuable:

### How You Can Help
- 🐛 **Bug Reports** - Report issues you encounter while using the application
- 💡 **Feature Suggestions** - Share ideas for new features or improvements  
- 📋 **User Feedback** - Provide feedback on usability and user experience
- 📚 **Documentation Feedback** - Suggest improvements to documentation clarity
- 🎓 **Student Perspectives** - Share insights from your academic workflow

### Reporting Issues
1. **Describe the problem** clearly with steps to reproduce
2. **Include system information** (OS, browser, version)
3. **Provide screenshots** if applicable
4. **Check existing reports** to avoid duplicates

**Note**: This software is under active development by a single developer. Response times may vary.

## 📄 License

**Proprietary Software - All Rights Reserved**

© 2025 Tony Trieu. All rights reserved.

### Usage Terms:

✅ **You CAN:**
- Use this web application for personal, educational, or research purposes
- Access and use the application through your web browser as provided

❌ **You CANNOT:**
- Modify, alter, or create derivative works of the source code
- Redistribute, share, or publish any part of the source code
- Reverse engineer, decompile, or disassemble the software
- Use this software for commercial purposes without explicit permission
- Remove or alter copyright notices
- Submit code contributions or pull requests

### Development Rights:
- **Exclusive Development**: Only the original author (Tony Trieu) has the right to modify, enhance, or maintain this codebase
- **No Contributions**: This is not an open-source project - code contributions from external developers are not accepted
- **Source Code Protection**: The source code is provided for transparency but remains under strict proprietary control

### Contact:
For licensing inquiries, feature requests, or bug reports, please contact the author directly. Commercial licensing may be available upon request.

---

Made with ❤️ for the educational community

