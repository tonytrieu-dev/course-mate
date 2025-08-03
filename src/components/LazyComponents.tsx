import { lazy } from 'react';

// Primary Views - Critical path
export const LazyDashboardView = lazy(() => 
  import('./DashboardView').then(module => ({ default: module.default }))
);

export const LazyTaskView = lazy(() => 
  import('./TaskView').then(module => ({ default: module.default }))
);

export const LazySimpleCalendar = lazy(() => 
  import('./SimpleCalendar').then(module => ({ default: module.default }))
);

// Grades System - Feature-based splitting
export const LazyGradeDashboard = lazy(() => 
  import('./GradeDashboard').then(module => ({ default: module.default }))
);

export const LazyGradeEntry = lazy(() => 
  import('./GradeEntry').then(module => ({ default: module.default }))
);

// Modal Components - User interaction based
export const LazyTaskModal = lazy(() => 
  import('./TaskModal').then(module => ({ default: module.default }))
);

export const LazySyllabusModal = lazy(() => 
  import('./SyllabusModal').then(module => ({ default: module.default }))
);

// Settings & Configuration - Administrative
export const LazySettings = lazy(() => 
  import('./Settings').then(module => ({ default: module.default }))
);

export const LazyCanvasSettings = lazy(() => 
  import('./CanvasSettings').then(module => ({ default: module.default }))
);

export const LazyNotificationSettings = lazy(() => 
  import('./NotificationSettings').then(module => ({ default: module.default }))
);

// Study Features - Analytics heavy
export const LazyStudySessionTracker = lazy(() => 
  import('./StudySessionTracker').then(module => ({ default: module.StudySessionTracker }))
);

export const LazyStudyAnalyticsDashboard = lazy(() => 
  import('./StudyAnalyticsDashboard').then(module => ({ default: module.default }))
);

export const LazyStudyScheduleOptimizer = lazy(() => 
  import('./StudyScheduleOptimizer').then(module => ({ default: module.default }))
);

// Chatbot System - AI heavy
export const LazyChatbotPanel = lazy(() => 
  import('./ChatbotPanel').then(module => ({ default: module.default }))
);

export const LazyChatbotAutocomplete = lazy(() => 
  import('./ChatbotAutocomplete').then(module => ({ default: module.default }))
);

// UI Components - Utility
export const LazyEditableText = lazy(() => 
  import('./EditableText').then(module => ({ default: module.default }))
);

export const LazyInlineSizeControl = lazy(() => 
  import('./InlineSizeControl').then(module => ({ default: module.default }))
);

// Authentication - Entry point
export const LazyLoginComponent = lazy(() => 
  import('./LoginComponent').then(module => ({ default: module.default }))
);

export const LazyLandingPage = lazy(() => 
  import('./LandingPage').then(module => ({ default: module.default }))
);

export const LazyAuthSection = lazy(() => 
  import('./AuthSection').then(module => ({ default: module.default }))
);

// Sidebar System - Layout critical
export const LazySidebar = lazy(() => 
  import('./Sidebar').then(module => ({ default: module.default }))
);

// Class Management
export const LazyClassList = lazy(() => 
  import('./ClassList').then(module => ({ default: module.default }))
);