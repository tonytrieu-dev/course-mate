# Notion-Inspired Productivity App

![Beta](https://img.shields.io/badge/Status-Beta-orange) ![Development](https://img.shields.io/badge/Stage-Active%20Development-yellow) ![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-blue)

> ⚠️ **BETA SOFTWARE**: This application is currently in beta/development phase. Expect bugs, incomplete features, and breaking changes. Use at your own risk and please report any issues you encounter.

A modern React + Electron productivity application designed to help students and other busy people manage their academic workflow. Features calendar management, task tracking, Canvas LMS calendar integration, and an AI-powered academic assistant - all completely free for educational and personal use.

> 🎓 **Built for Education**: This app is specifically designed for students and other busy people to keep track of all the things they need to do without any cost barriers.

## 🚀 Features

- **Calendar Management**: Interactive calendar with task and event tracking ✅ *Working*
- **Authentication**: Secure user authentication with Supabase ✅ *Working*
- **Canvas LMS Integration**: Sync with Canvas calendar and assignments 🚧 *In Development*
- **AI Chatbot**: Intelligent assistant for academic queries 🚧 *In Development*
- **File Management**: Upload and manage course materials 🚧 *In Development*
- **Offline Support**: Works offline with local storage fallback 🚧 *Partial*

## 🚧 Development Status

This application is actively being developed. Here's the current status:

### ✅ Completed Features
- Basic React + Electron application structure
- User authentication system with Supabase
- Calendar interface and basic task management
- Project structure and development environment

### 🚧 In Progress
- Canvas LMS integration and calendar sync
- AI chatbot functionality and academic assistance
- File upload and management system
- Improved offline capabilities
- UI/UX polish and responsive design

### 📋 Planned Features
- Mobile app version
- Advanced task automation
- Collaboration features
- Plugin system for extensibility
- Performance optimizations

## 🛠️ Setup Instructions

> ⚠️ **Development Setup**: These instructions are for setting up the development environment. This is beta software, so some setup steps may change as the project evolves.

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notion-inspired-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Development

### Project Structure

```
src/
├── components/      # React components
├── contexts/        # React context providers
├── services/        # API and business logic
├── utils/           # Utility functions
├── hooks/           # Custom React hooks
└── index.js         # Application entry point
```

### Key Utilities

- **Logger** (`src/utils/logger.js`): Centralized logging with configurable levels
- **Validation** (`src/utils/validation.js`): Input validation and sanitization
- **Error Handler** (`src/utils/errorHandler.js`): Standardized error handling
- **Storage** (`src/utils/storage.js`): Optimized localStorage management

### Scripts

- `npm start`: Development server

## 🔒 Security Features

- Environment variable configuration for sensitive data
- Input validation and sanitization
- Secure authentication flow
- Structured error handling to prevent information leakage
- Configurable logging levels

## 📱 Usage

1. **Authentication**: Sign up or log in with email/password
2. **Calendar**: View and manage tasks and events
3. **Canvas Integration**: Connect your Canvas account for auto-sync
4. **AI Assistant**: Chat with the AI for academic help
5. **File Management**: Upload and organize course materials

## ⚠️ Known Issues & Limitations

As this is beta software, please be aware of these current limitations:

- **Performance**: App may be slower than expected; optimization is ongoing
- **Data Persistence**: Occasional data loss may occur; backup important information
- **Browser Compatibility**: Primarily tested on Chrome/Chromium-based browsers
- **Canvas Integration**: Limited to calendar sync; full LMS features coming soon
- **Mobile Support**: Not yet optimized for mobile devices
- **Error Handling**: Some error messages may not be user-friendly

## 🧪 Testing

⚠️ **Beta Testing Notes**: This app is in development, so expect some features to be incomplete.

Run the application in development mode and test key features:
- ✅ Authentication flow (mostly stable)
- ✅ Calendar functionality (core features working)
- 🚧 Canvas integration (limited functionality)
- 🚧 AI chatbot responses (experimental)
- 🚧 File management (basic upload working)

## 🤝 Contributing

**We welcome contributions!** This project is in active development, so there are many opportunities to help:

### 🐛 Bug Reports
- Report any bugs or issues you encounter
- Include steps to reproduce and expected vs actual behavior
- Check existing issues first to avoid duplicates

### 💡 Feature Requests
- Suggest new features or improvements
- Explain your use case and why it would be helpful
- Keep in mind this is educational software

### 🔧 Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (especially important for beta software!)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

### 📝 Documentation
- Help improve documentation and setup instructions
- Write tutorials or guides for new users
- Translate content for non-English speakers

> **Note**: Since this is beta software, breaking changes may occur. We'll do our best to communicate these in advance.

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
