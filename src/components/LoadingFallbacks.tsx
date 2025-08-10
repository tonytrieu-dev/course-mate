import React from 'react';

// Enhanced loading fallbacks with skeleton screens for better UX

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", animate = true }) => (
  <div 
    className={`skeleton-rounded relative overflow-hidden ${animate ? 'animate-skeleton' : 'bg-gray-200 dark:bg-slate-700/50'} ${className}`}
  >
    {animate && (
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    )}
  </div>
);

// Sidebar Loading Skeleton
export const SidebarLoadingFallback: React.FC = () => (
  <div className="w-64 bg-gray-800 dark:bg-slate-800/90 p-4 space-y-4" role="status" aria-label="Loading sidebar">
    <Skeleton className="h-8 bg-gray-600 dark:bg-slate-600/50" />
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-6 bg-gray-700 dark:bg-slate-700/50" />
      ))}
    </div>
    <Skeleton className="h-32 bg-gray-700" />
    <span className="sr-only">Loading sidebar...</span>
  </div>
);

// Calendar Loading Skeleton
export const CalendarLoadingFallback: React.FC = () => (
  <div className="space-y-4" role="status" aria-label="Loading calendar">
    {/* Calendar Header */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
    
    {/* Calendar Grid */}
    <div className="grid grid-cols-7 gap-1">
      {[...Array(42)].map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
    <span className="sr-only">Loading calendar...</span>
  </div>
);

// Task View Loading Skeleton
export const TaskViewLoadingFallback: React.FC = () => (
  <div className="space-y-4" role="status" aria-label="Loading tasks">
    {/* Filter Bar */}
    <div className="flex space-x-2">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
    
    {/* Task List */}
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
    <span className="sr-only">Loading tasks...</span>
  </div>
);

// Dashboard Loading Skeleton
export const DashboardLoadingFallback: React.FC = () => (
  <div className="space-y-6" role="status" aria-label="Loading dashboard">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-2 bg-white">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    
    {/* Charts/Analytics */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
    <span className="sr-only">Loading dashboard...</span>
  </div>
);

// Grade Dashboard Loading Skeleton
export const GradeDashboardLoadingFallback: React.FC = () => (
  <div className="space-y-6" role="status" aria-label="Loading grades">
    {/* GPA Overview */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-2 bg-white">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
    
    {/* Grade List */}
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
    <span className="sr-only">Loading grades...</span>
  </div>
);

// Modal Loading Skeleton
export const ModalLoadingFallback: React.FC = () => (
  <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4" role="status" aria-label="Loading form">
    <Skeleton className="h-8 w-48" />
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
    <span className="sr-only">Loading form...</span>
  </div>
);

// Settings Loading Skeleton
export const SettingsLoadingFallback: React.FC = () => (
  <div className="space-y-6" role="status" aria-label="Loading settings">
    {[...Array(4)].map((_, section) => (
      <div key={section} className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {[...Array(3)].map((_, item) => (
            <div key={item} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    ))}
    <span className="sr-only">Loading settings...</span>
  </div>
);


// Generic Small Component Loading
export const SmallComponentLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-4" role="status" aria-label="Loading">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
    <span className="sr-only">Loading...</span>
  </div>
);

// Auth Loading Skeleton
export const AuthLoadingFallback: React.FC = () => (
  <div className="max-w-md mx-auto space-y-4" role="status" aria-label="Loading authentication">
    <Skeleton className="h-8 w-48 mx-auto" />
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
    <span className="sr-only">Loading authentication...</span>
  </div>
);