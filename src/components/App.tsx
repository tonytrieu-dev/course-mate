import React, { useState, useEffect, Suspense, lazy, memo, ReactNode } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { features } from "../utils/buildConfig";
import ErrorBoundary from "./ErrorBoundary";

// Lazy load heavy components for better initial load performance with proper TypeScript typing
const Sidebar = lazy(() => import("./Sidebar"));
const SimpleCalendar = lazy(() => import("./SimpleCalendar"));
const TaskView = lazy(() => import("./TaskView"));
const DashboardView = lazy(() => import("./DashboardView"));
const LoginComponent = lazy(() => import("./LoginComponent"));
const GradeDashboard = lazy(() => import("./GradeDashboard"));
const GradeEntry = lazy(() => import("./GradeEntry"));

// Define view types - now includes app views and calendar views
type AppViewType = "dashboard" | "tasks" | "calendar" | "grades";
type CalendarViewType = "month" | "week" | "day";

// Loading component interface
interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  'aria-label'?: string;
}

// Loading spinner component
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  size = "medium",
  "aria-label": ariaLabel 
}) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-12 w-12", 
    large: "h-16 w-16"
  };

  return (
    <div className="flex items-center justify-center">
      <div className="text-center" role="status" aria-live="polite">
        <div 
          className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600 mx-auto`} 
          aria-hidden="true"
        />
        <p className="mt-4 text-gray-600">
          <span className="sr-only">{ariaLabel || "Loading"}:</span> {message}
        </p>
      </div>
    </div>
  );
};

const CalendarApp: React.FC = () => {
  const [appView, setAppView] = useState<AppViewType>("dashboard");
  const [calendarView, setCalendarView] = useState<CalendarViewType>("month");
  const [gradeView, setGradeView] = useState<'dashboard' | 'entry'>('dashboard');
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner 
          message="Loading your calendar..." 
          size="large"
          aria-label="Loading application" 
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginFallback: ReactNode = (
      <div className="flex items-center justify-center h-screen">
        <div role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true" />
          <span className="sr-only">Loading login component...</span>
        </div>
      </div>
    );

    return (
      <Suspense fallback={loginFallback}>
        <LoginComponent />
      </Suspense>
    );
  }

  const sidebarFallback: ReactNode = (
    <div className="w-64 bg-gray-800 animate-pulse" role="status" aria-label="Loading sidebar">
      <span className="sr-only">Loading sidebar...</span>
    </div>
  );

  const sidebarErrorFallback: ReactNode = (
    <div className="w-64 bg-red-50 border-r border-red-200 flex items-center justify-center">
      <p className="text-red-600 text-sm">Sidebar error</p>
    </div>
  );

  const calendarFallback: ReactNode = (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <ErrorBoundary 
        name="Sidebar" 
        fallback={sidebarErrorFallback}
      >
        <Suspense fallback={sidebarFallback}>
          <Sidebar />
        </Suspense>
      </ErrorBoundary>
      
      <div className="flex-1 bg-gray-100 overflow-auto box-border min-w-0">
        {/* Main Navigation Header */}
        <div className={`bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
          isNavCollapsed ? 'h-0 overflow-hidden border-b-0' : 'px-4 sm:px-6 py-3'
        }`}>
          <div className="flex justify-center items-center">
            <nav className="flex space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
                { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                { id: 'grades', label: 'Grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map((nav) => (
                <button
                  key={nav.id}
                  onClick={() => setAppView(nav.id as AppViewType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    appView === nav.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={nav.icon} />
                  </svg>
                  {nav.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <div className="relative group">
          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className={`absolute ${isNavCollapsed ? 'top-1' : '-top-1'} left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 opacity-0 group-hover:opacity-100`}
            title={isNavCollapsed ? 'Show navigation' : 'Hide navigation'}
          >
            <svg 
              className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-300 ${
                isNavCollapsed ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-2 sm:p-4 lg:p-5">
          <ErrorBoundary name={`${appView}View`} showDetails={false}>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            }>
              {appView === 'dashboard' && (
                <DashboardView
                  onSwitchToTasks={() => setAppView('tasks')}
                  onSwitchToCalendar={() => setAppView('calendar')}
                  onSwitchToGrades={() => setAppView('grades')}
                />
              )}
              {appView === 'tasks' && (
                <TaskView />
              )}
              {appView === 'calendar' && (
                <SimpleCalendar 
                  view={calendarView} 
                  onViewChange={setCalendarView}
                />
              )}
              {appView === 'grades' && (
                <div className="space-y-4">
                  {/* Grade View Toggle */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGradeView('dashboard')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          gradeView === 'dashboard'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        📊 Dashboard
                      </button>
                      <button
                        onClick={() => setGradeView('entry')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          gradeView === 'entry'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        ✏️ Add Grades
                      </button>
                    </div>
                  </div>

                  {/* Grade Content */}
                  {gradeView === 'dashboard' && (
                    <GradeDashboard 
                      onSwitchToGradeEntry={() => setGradeView('entry')}
                    />
                  )}
                  {gradeView === 'entry' && (
                    <GradeEntry 
                      onGradeAdded={() => {
                        // Refresh dashboard and switch to it
                        setGradeView('dashboard');
                      }}
                    />
                  )}
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

// Memoize CalendarApp to prevent unnecessary re-renders
const MemoizedCalendarApp = memo(CalendarApp);
MemoizedCalendarApp.displayName = 'MemoizedCalendarApp';

// Top-level App component props interface
interface AppProps {
  children?: ReactNode;
}

// Wrap the app with the AuthProvider and top-level Error Boundary
const App: React.FC<AppProps> = ({ children }) => {
  const appErrorFallback: ReactNode = (
    <div className="flex items-center justify-center h-screen bg-red-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
        <p className="text-gray-700 mb-4">
          Something went wrong with the application. Please refresh the page and try again.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          type="button"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      name="Application" 
      showDetails={true}
      fallback={appErrorFallback}
    >
      <AuthProvider>
        {features.subscriptions ? (
          <SubscriptionProvider>
            <MemoizedCalendarApp />
            {children}
          </SubscriptionProvider>
        ) : (
          <>
            <MemoizedCalendarApp />
            {children}
          </>
        )}
      </AuthProvider>
    </ErrorBoundary>
  );
};

App.displayName = 'App';

export default App;