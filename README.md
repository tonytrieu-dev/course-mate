# Notion-Inspired Productivity App

A modern React + Electron productivity application with calendar management, task tracking, and Canvas LMS integration.

## 🚀 Features

- **Calendar Management**: Interactive calendar with task and event tracking
- **Authentication**: Secure user authentication with Supabase
- **Canvas LMS Integration**: Sync with Canvas calendar and assignments
- **AI Chatbot**: Intelligent assistant for academic queries
- **File Management**: Upload and manage course materials
- **Offline Support**: Works offline with local storage fallback

## 🛠️ Setup Instructions

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
- `npm run build`: Production build
- `npm run electron`: Start Electron app
- `npm run dist`: Build Electron distributables

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

## 🧪 Testing

Run the application in development mode and test key features:
- Authentication flow
- Calendar functionality
- Canvas integration
- AI chatbot responses

## 🚀 Deployment

### Web Deployment
```bash
npm run build
# Deploy the build/ directory to your web server
```

### Electron Distribution
```bash
npm run dist
# Distributables will be in dist-electron/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License - see package.json for details
