import React, { useState, useEffect, Suspense, lazy, memo, ReactNode } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { features } from "../utils/buildConfig";
import ErrorBoundary from "./ErrorBoundary";

// Lazy load heavy components for better initial load performance with proper TypeScript typing
const Sidebar = lazy(() => import("./Sidebar"));
const SimpleCalendar = lazy(() => import("./SimpleCalendar"));
const LoginComponent = lazy(() => import("./LoginComponent"));

// Define view types
type ViewType = "month" | "week" | "day";

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
  const [view, setView] = useState<ViewType>("month");
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
      
      <div className="flex-1 p-2 sm:p-4 lg:p-5 bg-gray-100 overflow-auto box-border pt-4 sm:pt-8 lg:pt-20 min-w-0">
        {/* Header with auth controls */}
        <div className="flex justify-between items-center mb-2 sm:mb-4 relative">
          <div className="flex items-center">
            {/* View controls removed */}
          </div>
        </div>

        <ErrorBoundary name="Calendar" showDetails={false}>
          <Suspense fallback={calendarFallback}>
            <SimpleCalendar view={view} />
          </Suspense>
        </ErrorBoundary>
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