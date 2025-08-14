import React, { useState, useEffect, Suspense, lazy, memo, ReactNode, useCallback } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { features } from "../utils/buildConfig";
import { logger } from "../utils/logger";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ErrorBoundary from "./ErrorBoundary";
import ThemeToggle from "./ThemeToggle";
import { getSettingsWithSync, updateNavigationOrder, updateSelectedView } from "../services/settings/settingsOperations";
import { SyllabusSecurityService } from "../services/syllabusSecurityService";
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

// Navigation item interface
interface NavigationItem {
  id: AppViewType;
  label: string;
  icon: string;
}

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
    small: "h-6 w-6",
    medium: "h-8 w-8", 
    large: "h-12 w-12"
  };

  return (
    <div className="flex items-center justify-center animate-fadeIn">
      <div className="text-center" role="status" aria-live="polite">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${sizeClasses[size]}`} />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          <span className="sr-only">{ariaLabel || "Loading"}:</span> {message}
        </p>
      </div>
    </div>
  );
};

const CalendarApp: React.FC = () => {
  // State for navigation and settings
  const [appView, setAppView] = useState<AppViewType>("dashboard");
  const [calendarView, setCalendarView] = useState<CalendarViewType>("month");
  const [gradeView, setGradeView] = useState<'dashboard' | 'entry'>('dashboard');
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [reorderTimer, setReorderTimer] = useState<NodeJS.Timeout | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const { user, isAuthenticated, logout, loading, setLastCalendarSyncTimestamp } = useAuth();

  // Default navigation items with conditional grades feature
  const defaultNavItems: NavigationItem[] = [
    { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    ...(features.showGradeAnalytics ? [{ id: 'grades' as AppViewType, label: 'Grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }] : [])
  ];

  // Navigation items state - will be populated from settings
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(defaultNavItems);

  // Task refresh callback - triggers refresh of all task-related views
  const refreshTasks = useCallback(() => {
    // Trigger auth context to reload data by updating the timestamp
    // This will cause all components that depend on lastCalendarSyncTimestamp to refresh
    setLastCalendarSyncTimestamp(Date.now());
  }, [setLastCalendarSyncTimestamp]);

  // Save navigation order with cross-device sync
  const saveNavigationOrder = useCallback(async (items: NavigationItem[]) => {
    const order = items.map(item => item.id);
    try {
      await updateNavigationOrder(order, user?.id);
    } catch (error) {
      logger.warn('Failed to save navigation order', { error });
    }
  }, [user?.id]);

  // Load user settings with cross-device sync when authentication state changes
  useEffect(() => {
    if (loading) return; // Wait for auth to finish loading
    
    const loadSettings = async () => {
      try {
        // Note: Secure bucket 'secure-syllabi' already exists in Supabase
        // No need to initialize on startup as it's pre-configured manually

        const settings = await getSettingsWithSync(user?.id);
        
        // Apply navigation order if available
        if (settings.navigationOrder && settings.navigationOrder.length > 0) {
          const reorderedItems = settings.navigationOrder.map(id => 
            defaultNavItems.find(item => item.id === id)
          ).filter((item): item is NavigationItem => item !== undefined);
          
          // Add any missing items to the end
          const missingItems = defaultNavItems.filter(item => 
            !settings.navigationOrder!.includes(item.id)
          );
          
          setNavigationItems([...reorderedItems, ...missingItems]);
        }
        
        // Apply selected view if available and feature is enabled
        if (settings.selectedView && 
            ['dashboard', 'tasks', 'calendar', 'grades'].includes(settings.selectedView)) {
          // Don't allow grades view if feature is disabled
          if (settings.selectedView === 'grades' && !features.showGradeAnalytics) {
            setAppView('dashboard');
          } else {
            setAppView(settings.selectedView);
          }
        }
        
        setSettingsLoaded(true);
      } catch (error) {
        logger.warn('Failed to load settings', { error });
        setSettingsLoaded(true); // Still mark as loaded to prevent infinite loading
      }
    };
    
    loadSettings();
  }, [loading, user?.id]);

  // Save selected view with cross-device sync whenever it changes
  useEffect(() => {
    if (!settingsLoaded) return; // Don't save during initial load
    
    const saveSelectedView = async () => {
      try {
        await updateSelectedView(appView, user?.id);
      } catch (error) {
        logger.warn('Failed to save selected view', { error });
      }
    };
    
    saveSelectedView();
  }, [appView, user?.id, settingsLoaded]);

  // Analytics dashboard keyboard shortcut (Ctrl+Alt+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === 'a') {
        event.preventDefault();
        setShowAnalytics(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // iOS-style reorder mode activation
  const enterReorderMode = useCallback(() => {
    setIsReorderMode(true);
    // Auto-exit reorder mode after 10 seconds of inactivity
    if (reorderTimer) clearTimeout(reorderTimer);
    const timer = setTimeout(() => {
      setIsReorderMode(false);
    }, 10000);
    setReorderTimer(timer);
  }, [reorderTimer]);

  const exitReorderMode = useCallback(() => {
    setIsReorderMode(false);
    if (reorderTimer) clearTimeout(reorderTimer);
    setReorderTimer(null);
  }, [reorderTimer]);

  // Long press detection for entering reorder mode
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    // Only activate on navigation buttons, not other elements
    e.stopPropagation();
    const timer = setTimeout(() => {
      enterReorderMode();
    }, 800); // Increased to 800ms to prevent accidental activation

    // Store timer on the element for cleanup
    (e.currentTarget as any)._longPressTimer = timer;
  }, [enterReorderMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timer
    const timer = (e.currentTarget as any)._longPressTimer;
    if (timer) {
      clearTimeout(timer);
      delete (e.currentTarget as any)._longPressTimer;
    }
  }, []);

  // Enhanced drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    // Only allow drag from navigation buttons
    e.stopPropagation();
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    enterReorderMode();
    // Add visual feedback
    e.currentTarget.classList.add('opacity-50');
  }, [enterReorderMode]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
    setDragOverItem(null);
    // Keep reorder mode active for a bit longer after drag ends
    if (reorderTimer) clearTimeout(reorderTimer);
    const timer = setTimeout(() => {
      setIsReorderMode(false);
    }, 3000);
    setReorderTimer(timer);
  }, [reorderTimer]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDragOverItem(null);
      return;
    }

    const newItems = [...navigationItems];
    const draggedNavItem = newItems[draggedItem];
    
    // Remove dragged item
    newItems.splice(draggedItem, 1);
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedNavItem);
    
    setNavigationItems(newItems);
    saveNavigationOrder(newItems);
    setDragOverItem(null);
  }, [draggedItem, navigationItems, saveNavigationOrder]);

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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (reorderTimer) {
        clearTimeout(reorderTimer);
      }
    };
  }, [reorderTimer]);

  const handleGetStarted = () => {
    setShowLanding(false);
    // Update URL without page reload
    window.history.pushState({}, '', window.location.pathname + '?app=true');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 animate-fadeIn">
        <LoadingSpinner 
          message="Loading your calendar..." 
          size="medium"
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

  // Force login component for unauthenticated users, regardless of other conditions
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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
      {/* Reorder mode overlay - covers everything */}
      {isReorderMode && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-40 animate-fadeIn"
          onClick={exitReorderMode}
        />
      )}
      {/* Mobile Sidebar Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isNavCollapsed ? 'hidden' : 'block'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsNavCollapsed(true)} />
        <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-50 dark:bg-gray-900">
          <ErrorBoundary 
            name="Sidebar" 
            fallback={sidebarErrorFallback}
          >
            <Suspense fallback={sidebarFallback}>
              <Sidebar 
                isNavCollapsed={isNavCollapsed}
                setIsNavCollapsed={setIsNavCollapsed}
                onTasksRefresh={refreshTasks}
              />
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
            <Sidebar 
              isNavCollapsed={isNavCollapsed}
              setIsNavCollapsed={setIsNavCollapsed}
              onTasksRefresh={refreshTasks}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
      
      <div className="flex-1 bg-gray-200 dark:bg-gray-900 overflow-auto box-border min-w-0">
        {/* Main Navigation Header */}
        <div className={`bg-gray-50 dark:bg-gray-800 transition-all duration-300 ease-in-out relative ${
          isReorderMode ? 'z-50' : 'z-10'
        } ${
          isNavCollapsed ? 'h-0 overflow-hidden border-b-0' : 'px-2 sm:px-4 lg:px-6 py-3'
        }`}>
          {/* Reorder mode indicator */}
          {isReorderMode && (
            <div className="text-center py-1 mb-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                📱 Reorder Mode Active - Tap outside to exit
              </span>
            </div>
          )}
          <div 
            className="flex justify-between lg:justify-center items-center group"
            onClick={(e) => {
              // Exit reorder mode when clicking outside nav buttons
              if (isReorderMode && e.target === e.currentTarget) {
                exitReorderMode();
              }
            }}
          >
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsNavCollapsed(false)}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <nav className="flex space-x-0.5 sm:space-x-1">
              {navigationItems.map((nav, index) => (
                <button
                  key={nav.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onTouchStart={(e) => {
                    // Only handle touch events on the navigation buttons themselves
                    if (e.currentTarget.contains(e.target as Node)) {
                      handleTouchStart(e, index);
                    }
                  }}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onClick={(e) => {
                    // Stop event bubbling to prevent interference
                    e.stopPropagation();
                    
                    // Prevent navigation if in reorder mode and not dragging
                    if (isReorderMode && draggedItem === null) {
                      e.preventDefault();
                      return;
                    }
                    
                    // Prevent accessing grades view if feature is disabled
                    if (nav.id === 'grades' && !features.showGradeAnalytics) {
                      return;
                    }
                    
                    setAppView(nav.id);
                    exitReorderMode();
                  }}
                  className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-smooth flex items-center gap-1 sm:gap-2 whitespace-nowrap select-none ${
                    isReorderMode 
                      ? 'cursor-grab' 
                      : 'cursor-move'
                  } ${
                    appView === nav.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm border border-blue-200 dark:border-blue-700'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm hover:scale-105 active:scale-95'
                  } ${
                    dragOverItem === index && draggedItem !== index
                      ? 'border-2 border-blue-400 dark:border-blue-500 border-dashed bg-blue-50 dark:bg-blue-900/30'
                      : ''
                  } ${
                    draggedItem === index
                      ? 'opacity-50 scale-105'
                      : ''
                  }`}
                  title={
                    isReorderMode 
                      ? `${nav.label} - Tap anywhere to exit reorder mode` 
                      : `${nav.label} - Long press or drag to reorder`
                  }
                >
                  {/* Drag handle indicator - more visible in reorder mode */}
                  <svg 
                    className={`w-3 h-3 text-gray-400 dark:text-gray-500 mr-1 transition-opacity ${
                      isReorderMode ? 'opacity-100' : 'opacity-60'
                    }`} 
                    fill="currentColor" 
                    viewBox="0 0 6 10"
                  >
                    <circle cx="2" cy="2" r="1"/>
                    <circle cx="2" cy="5" r="1"/>
                    <circle cx="2" cy="8" r="1"/>
                    <circle cx="4" cy="2" r="1"/>
                    <circle cx="4" cy="5" r="1"/>
                    <circle cx="4" cy="8" r="1"/>
                  </svg>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={nav.icon} />
                  </svg>
                  <span className="hidden sm:inline">{nav.label}</span>
                  <span className="sm:hidden">{nav.label.charAt(0)}</span>
                </button>
              ))}
            </nav>

            {/* Theme toggle - appears on hover */}
            <div className="flex items-center ml-6 sm:ml-8">
              <ThemeToggle />
              {/* Right spacer for mobile */}
              <div className="lg:hidden w-2" />
            </div>
          </div>
        </div>


        {/* Main Content Area */}
        <div 
          className={`p-1 sm:p-2 md:p-4 lg:p-5 ${isNavCollapsed ? 'pt-8 sm:pt-10 md:pt-12' : 'pt-4 sm:pt-6 md:pt-8'}`}
          onClick={() => {
            // Exit reorder mode when clicking in main content area
            if (isReorderMode) {
              exitReorderMode();
            }
          }}
        >
          <ErrorBoundary name={`${appView}View`} showDetails={false}>
            {appView === 'dashboard' && (
              <Suspense fallback={<DashboardLoadingFallback />}>
                <div className="animate-fadeIn">
                  <DashboardView
                  onSwitchToTasks={() => setAppView('tasks')}
                  onSwitchToCalendar={() => setAppView('calendar')}
                  onSwitchToGrades={() => {
                    if (features.showGradeAnalytics) {
                      setAppView('grades');
                    }
                  }}
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
            {appView === 'grades' && features.showGradeAnalytics && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Grade View Toggle */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition-smooth">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGradeView('dashboard')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                          gradeView === 'dashboard'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm border border-blue-200 dark:border-blue-700'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm hover:scale-105 active:scale-95'
                        }`}
                      >
                        📊 Dashboard
                      </button>
                      <button
                        onClick={() => setGradeView('entry')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                          gradeView === 'entry'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm border border-blue-200 dark:border-blue-700'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm hover:scale-105 active:scale-95'
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
      
      {/* Analytics Dashboard - Access with Ctrl+Alt+A */}
      <AnalyticsDashboard 
        isVisible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
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

// Theme provider that has access to auth context
const ThemeProviderWithAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <ThemeProvider userId={user?.id}>
      {children}
    </ThemeProvider>
  );
};

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
        <ThemeProviderWithAuth>
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
        </ThemeProviderWithAuth>
      </AuthProvider>
    </ErrorBoundary>
  );
};

App.displayName = 'App';

export default App;