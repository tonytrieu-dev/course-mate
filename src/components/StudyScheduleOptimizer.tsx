import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  StudySchedule,
  StudySession,
  WorkloadAnalysis,
  StudyProfile,
  OptimizationGoal,
  StudyScheduleUIState,
  ScheduleGenerationStatus,
  StudyScheduleFeatureLimits
} from '../types/studySchedule';
import type { ClassWithRelations } from '../types/database';
import { useStudyScheduleContext } from '../contexts/StudyScheduleContext';
import { logger } from '../utils/logger';

// Sub-components
import ScheduleCalendarView from './studySchedule/ScheduleCalendarView';
import WorkloadAnalysisPanel from './studySchedule/WorkloadAnalysisPanel';
import ScheduleConfigurationPanel from './studySchedule/ScheduleConfigurationPanel';
import StudySessionDetails from './studySchedule/StudySessionDetails';
import RetentionAnalytics from './studySchedule/RetentionAnalytics';
import PremiumUpgradePrompt from './studySchedule/PremiumUpgradePrompt';

interface StudyScheduleOptimizerProps {
  user: User;
  classes: ClassWithRelations[];
  useSupabase?: boolean;
  isVisible: boolean;
  onClose: () => void;
}

export const StudyScheduleOptimizer: React.FC<StudyScheduleOptimizerProps> = ({
  user,
  classes,
  useSupabase = false,
  isVisible,
  onClose
}) => {
  // Use study schedule context
  const {
    currentSchedule,
    workloadAnalysis,
    studyProfile,
    featureLimits,
    isPremium,
    isLoading,
    error,
    loadWorkloadAnalysis,
    generateSchedule,
    updateStudyProfile,
    updateSessionStatus,
    upgradePrompt,
    checkFeatureAccess
  } = useStudyScheduleContext();
  
  const [generationStatus, setGenerationStatus] = useState<ScheduleGenerationStatus>({
    status: 'idle',
    progress: 0,
    current_step: '',
    estimated_completion: ''
  });
  
  // UI state
  const [uiState, setUIState] = useState<StudyScheduleUIState>({
    selectedWeek: new Date(),
    viewMode: 'week',
    showCompleted: true,
    selectedSession: null,
    classFilter: [],
    sessionTypeFilter: [],
    showAnalytics: false,
    analyticsTimeRange: '1month'
  });
  
  const [showConfiguration, setShowConfiguration] = useState(false);
  
  /**
   * Load initial data when component mounts
   */
  useEffect(() => {
    if (isVisible && user && !workloadAnalysis) {
      loadWorkloadAnalysis();
    }
  }, [isVisible, user, workloadAnalysis, loadWorkloadAnalysis]);
  
  /**
   * Generate new optimized study schedule with status tracking
   */
  const handleGenerateSchedule = useCallback(async (
    optimizationGoals: OptimizationGoal[],
    startDate: Date,
    endDate: Date,
    includeClasses: string[] = []
  ) => {
    try {
      setGenerationStatus({
        status: 'analyzing',
        progress: 10,
        current_step: 'Analyzing current workload...',
        estimated_completion: new Date(Date.now() + 30000).toISOString()
      });
      
      setGenerationStatus({
        status: 'generating',
        progress: 40,
        current_step: 'Generating optimized schedule...',
        estimated_completion: new Date(Date.now() + 20000).toISOString()
      });
      
      const scheduleRequest = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        optimization_goals: optimizationGoals,
        include_classes: includeClasses.length > 0 ? includeClasses : classes.map(c => c.id),
        exclude_dates: [],
        force_regenerate: true,
        preserve_completed_sessions: false
      };
      
      setGenerationStatus({
        status: 'optimizing',
        progress: 70,
        current_step: 'Optimizing schedule quality...',
        estimated_completion: new Date(Date.now() + 10000).toISOString()
      });
      
      // Use context method that includes premium checks
      await generateSchedule(scheduleRequest);
      
      setGenerationStatus({
        status: 'complete',
        progress: 100,
        current_step: 'Schedule generated successfully!',
        estimated_completion: new Date().toISOString()
      });
      
      // Reset status after a delay
      setTimeout(() => {
        setGenerationStatus({
          status: 'idle',
          progress: 0,
          current_step: '',
          estimated_completion: ''
        });
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate study schedule';
      setGenerationStatus({
        status: 'error',
        progress: 0,
        current_step: 'Generation failed',
        estimated_completion: '',
        error_message: errorMessage
      });
      
      logger.error('[StudyScheduleOptimizer] Error generating schedule', err);
    }
  }, [generateSchedule, classes]);
  
  
  /**
   * Filter sessions based on current UI state
   */
  const filteredSessions = useMemo(() => {
    if (!currentSchedule) return [];
    
    return currentSchedule.study_sessions.filter(session => {
      // Class filter
      if (uiState.classFilter.length > 0 && !uiState.classFilter.includes(session.class_id)) {
        return false;
      }
      
      // Session type filter
      if (uiState.sessionTypeFilter.length > 0 && !uiState.sessionTypeFilter.includes(session.session_type)) {
        return false;
      }
      
      // Completed sessions filter
      if (!uiState.showCompleted && session.status === 'completed') {
        return false;
      }
      
      // Date range filter based on selected week/month
      const sessionDate = new Date(session.date);
      if (uiState.viewMode === 'week') {
        const weekStart = getWeekStart(uiState.selectedWeek);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      }
      
      return true;
    });
  }, [currentSchedule, uiState]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Study Schedule Optimizer</h2>
            {!featureLimits.ai_recommendations_enabled && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Limited Features
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowConfiguration(!showConfiguration)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configure
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Configuration and Analysis */}
          <div className={`${showConfiguration ? 'w-1/3' : 'w-16'} border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
            {showConfiguration ? (
              <div className="h-full overflow-y-auto">
                {/* Schedule Configuration - Moved to top */}
                <ScheduleConfigurationPanel
                  studyProfile={studyProfile}
                  onProfileUpdate={updateStudyProfile}
                  onGenerateSchedule={handleGenerateSchedule}
                  generationStatus={generationStatus}
                  featureLimits={featureLimits}
                  classes={classes}
                />
                
                {/* Workload Analysis */}
                {workloadAnalysis && (
                  <WorkloadAnalysisPanel
                    analysis={workloadAnalysis}
                    classes={classes}
                    featureLimits={featureLimits}
                  />
                )}
                
                {/* Premium Upgrade Prompt */}
                {!featureLimits.ai_recommendations_enabled && (
                  <PremiumUpgradePrompt />
                )}
              </div>
            ) : (
              <div className="p-4 flex flex-col items-center space-y-4">
                <button
                  onClick={() => setShowConfiguration(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Show Configuration"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Main Calendar View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading study schedule data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-red-600">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">Error Loading Schedule</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button
                    onClick={loadWorkloadAnalysis}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Calendar View */}
                <ScheduleCalendarView
                  schedule={currentSchedule}
                  sessions={filteredSessions}
                  uiState={uiState}
                  onUIStateChange={setUIState}
                  onSessionUpdate={updateSessionStatus}
                  classes={classes}
                />
                
                {/* Analytics Panel */}
                {uiState.showAnalytics && featureLimits.retention_analytics_enabled && (
                  <RetentionAnalytics
                    userId={user.id}
                    timeRange={uiState.analyticsTimeRange}
                    classes={classes}
                  />
                )}
              </>
            )}
          </div>
          
          {/* Right Sidebar - Session Details */}
          {uiState.selectedSession && (
            <div className="w-1/3 border-l border-gray-200 overflow-y-auto">
              <StudySessionDetails
                session={uiState.selectedSession}
                onUpdate={updateSessionStatus}
                onClose={() => setUIState(prev => ({ ...prev, selectedSession: null }))}
                classes={classes}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Helper functions
 */
function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  return new Date(start.setDate(diff));
}

export default StudyScheduleOptimizer;