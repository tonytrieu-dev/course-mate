import React, { useState, useEffect, Suspense, lazy, memo, ReactNode } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { features } from "../utils/buildConfig";
import ErrorBoundary from "./ErrorBoundary";
import {
  SidebarLoadingFallback,
  CalendarLoadingFallback,
  TaskViewLoadingFallback,
  DashboardLoadingFallback,
  GradeDashboardLoadingFallback,
  AuthLoadingFallback
} from "./LoadingFallbacks";

// Lazy load components using optimized lazy loading system
import {
  LazySidebar as Sidebar,
  LazySimpleCalendar as SimpleCalendar,
  LazyTaskView as TaskView,
  LazyDashboardView as DashboardView,
  LazyLoginComponent as LoginComponent,
  LazyGradeDashboard as GradeDashboard,
  LazyGradeEntry as GradeEntry,
  LazyLandingPage as LandingPage
} from "./LazyComponents";

// Define view types - now includes app views and calendar views
type AppViewType = "dashboard" | "tasks" | "calendar" | "grades";
type CalendarViewType = "month" | "week" | "day";

// Loading component interface
interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  'aria-label'?: string;
}

// Simple loading spinner component
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  size = "medium",
  "aria-label": ariaLabel 
}) => {
  const sizeClasses = {
    small: "h-16 w-16",
    medium: "h-20 w-20", 
    large: "h-24 w-24"
  };

  return (
    <div className="flex items-center justify-center animate-fadeIn">
      <div className="text-center" role="status" aria-live="polite">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${sizeClasses[size]}`} />
        <p className="mt-6 text-gray-600 text-lg">
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
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Handle URL state for landing page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const app = urlParams.get('app');
    const forceLanding = urlParams.get('landing');
    
    // Force landing page for testing with ?landing=true
    if (forceLanding === 'true') {
      setShowLanding(true);
      return;
    }
    
    if (app === 'true' || isAuthenticated) {
      setShowLanding(false);
    }
  }, [isAuthenticated]);

  const handleGetStarted = () => {
    setShowLanding(false);
    // Update URL without page reload
    window.history.pushState({}, '', window.location.pathname + '?app=true');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 animate-fadeIn">
        <LoadingSpinner 
          message="Loading your calendar..." 
          size="small"
          aria-label="Loading application" 
        />
      </div>
    );
  }

  // Show landing page if showLanding is true (regardless of auth status for testing)
  if (showLanding && (new URLSearchParams(window.location.search).get('landing') === 'true' || !isAuthenticated)) {
    const landingFallback: ReactNode = (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner 
          message="Loading..." 
          size="small"
          aria-label="Loading landing page" 
        />
      </div>
    );

    return (
      <Suspense fallback={landingFallback}>
        <LandingPage onGetStarted={handleGetStarted} />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<AuthLoadingFallback />}>
        <LoginComponent />
      </Suspense>
    );
  }

  const sidebarFallback: ReactNode = <SidebarLoadingFallback />;

  const sidebarErrorFallback: ReactNode = (
    <div className="w-64 bg-red-50 border-r border-red-200 flex items-center justify-center">
      <p className="text-red-600 text-sm">Sidebar error</p>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isNavCollapsed ? 'hidden' : 'block'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsNavCollapsed(true)} />
        <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw]">
          <ErrorBoundary 
            name="Sidebar" 
            fallback={sidebarErrorFallback}
          >
            <Suspense fallback={sidebarFallback}>
              <Sidebar />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ErrorBoundary 
          name="Sidebar" 
          fallback={sidebarErrorFallback}
        >
          <Suspense fallback={sidebarFallback}>
            <Sidebar />
          </Suspense>
        </ErrorBoundary>
      </div>
      
      <div className="flex-1 bg-gray-100 overflow-auto box-border min-w-0">
        {/* Main Navigation Header */}
        <div className={`bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
          isNavCollapsed ? 'h-0 overflow-hidden border-b-0' : 'px-2 sm:px-4 lg:px-6 py-3'
        }`}>
          <div className="flex justify-between lg:justify-center items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsNavCollapsed(false)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <nav className="flex space-x-0.5 sm:space-x-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
                { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                { id: 'grades', label: 'Grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map((nav) => (
                <button
                  key={nav.id}
                  onClick={() => setAppView(nav.id as AppViewType)}
                  className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-smooth flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                    appView === nav.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm hover:scale-105 active:scale-95'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={nav.icon} />
                  </svg>
                  <span className="hidden sm:inline">{nav.label}</span>
                  <span className="sm:hidden">{nav.label.charAt(0)}</span>
                </button>
              ))}
            </nav>

            {/* Right spacer for mobile */}
            <div className="lg:hidden w-2" />
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <div className="relative group">
          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className={`absolute ${isNavCollapsed ? '-top-2' : '-top-3'} left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 opacity-0 group-hover:opacity-100`}
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
        <div className="p-1 sm:p-2 md:p-4 lg:p-5">
          <ErrorBoundary name={`${appView}View`} showDetails={false}>
            {appView === 'dashboard' && (
              <Suspense fallback={<DashboardLoadingFallback />}>
                <div className="animate-fadeIn">
                  <DashboardView
                  onSwitchToTasks={() => setAppView('tasks')}
                  onSwitchToCalendar={() => setAppView('calendar')}
                  onSwitchToGrades={() => setAppView('grades')}
                />
                </div>
              </Suspense>
            )}
            {appView === 'tasks' && (
              <Suspense fallback={<TaskViewLoadingFallback />}>
                <div className="animate-fadeIn">
                  <TaskView />
                </div>
              </Suspense>
            )}
            {appView === 'calendar' && (
              <Suspense fallback={<CalendarLoadingFallback />}>
                <div className="animate-fadeIn">
                  <SimpleCalendar 
                    view={calendarView} 
                    onViewChange={setCalendarView}
                  />
                </div>
              </Suspense>
            )}
            {appView === 'grades' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Grade View Toggle */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-smooth">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGradeView('dashboard')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                          gradeView === 'dashboard'
                            ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm hover:scale-105 active:scale-95'
                        }`}
                      >
                        📊 Dashboard
                      </button>
                      <button
                        onClick={() => setGradeView('entry')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                          gradeView === 'entry'
                            ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm hover:scale-105 active:scale-95'
                        }`}
                      >
                        ✏️ Add Grades
                      </button>
                    </div>
                  </div>

                  {/* Grade Content */}
                  {gradeView === 'dashboard' && (
                    <Suspense fallback={<GradeDashboardLoadingFallback />}>
                      <div className="animate-scaleIn">
                        <GradeDashboard 
                          onSwitchToGradeEntry={() => setGradeView('entry')}
                        />
                      </div>
                    </Suspense>
                  )}
                  {gradeView === 'entry' && (
                    <Suspense fallback={<GradeDashboardLoadingFallback />}>
                      <div className="animate-scaleIn">
                        <GradeEntry 
                          onGradeAdded={() => {
                            // Refresh dashboard and switch to it
                            setGradeView('dashboard');
                          }}
                        />
                      </div>
                    </Suspense>
                  )}
                </div>
              )}
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