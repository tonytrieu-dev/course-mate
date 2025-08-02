import { useState, useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  StudySchedule,
  StudyProfile,
  WorkloadAnalysis,
  StudySession,
  ScheduleOptimizationRequest,
  StudyScheduleResponse,
  WorkloadAnalysisResponse
} from '../types/studySchedule';
import type { ClassWithRelations, Task } from '../types/database';
import { StudyScheduleService } from '../services/studyScheduleService';
import { getTasks } from '../services/dataService';
import { logger } from '../utils/logger';

interface UseStudyScheduleProps {
  user: User | null;
  classes: ClassWithRelations[];
  useSupabase?: boolean;
}

interface UseStudyScheduleReturn {
  // Core state
  currentSchedule: StudySchedule | null;
  workloadAnalysis: WorkloadAnalysis | null;
  studyProfile: StudyProfile | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadWorkloadAnalysis: () => Promise<void>;
  generateSchedule: (request: Omit<ScheduleOptimizationRequest, 'user_id'>) => Promise<void>;
  updateStudyProfile: (profile: StudyProfile) => Promise<void>;
  updateSessionStatus: (
    sessionId: string, 
    status: StudySession['status'], 
    feedback?: any
  ) => Promise<void>;
  refreshFromCanvasTasks: () => Promise<void>;
  
  // Data
  getTasksForScheduling: () => Promise<Task[]>;
  getScheduleForDateRange: (startDate: Date, endDate: Date) => StudySession[];
  getUpcomingSessions: (days?: number) => StudySession[];
  getCompletedSessions: (days?: number) => StudySession[];
  
  // Analytics
  getScheduleStats: () => {
    totalSessions: number;
    completedSessions: number;
    totalStudyHours: number;
    averageSessionLength: number;
    completionRate: number;
    classDistribution: Record<string, number>;
  };
}

export const useStudySchedule = ({
  user,
  classes,
  useSupabase = false
}: UseStudyScheduleProps): UseStudyScheduleReturn => {
  // Core state
  const [currentSchedule, setCurrentSchedule] = useState<StudySchedule | null>(null);
  const [workloadAnalysis, setWorkloadAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [studyProfile, setStudyProfile] = useState<StudyProfile | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load workload analysis from Canvas tasks and AI analysis
   */
  const loadWorkloadAnalysis = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('[useStudySchedule] Loading workload analysis', { userId: user.id });
      
      const analysisResponse: WorkloadAnalysisResponse = await StudyScheduleService.analyzeWorkload(
        user,
        useSupabase
      );
      
      setWorkloadAnalysis(analysisResponse.analysis);
      
      logger.debug('[useStudySchedule] Workload analysis loaded successfully', {
        totalAssignments: analysisResponse.analysis.total_assignments,
        estimatedHours: analysisResponse.analysis.estimated_total_hours
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workload analysis';
      setError(errorMessage);
      logger.error('[useStudySchedule] Error loading workload analysis', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, useSupabase]);
  
  /**
   * Generate optimized study schedule
   */
  const generateSchedule = useCallback(async (
    request: Omit<ScheduleOptimizationRequest, 'user_id'>
  ) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    if (!studyProfile) {
      setError('Study profile not available');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('[useStudySchedule] Generating study schedule', request);
      
      const fullRequest: ScheduleOptimizationRequest = {
        ...request,
        user_id: user.id
      };
      
      const scheduleResponse: StudyScheduleResponse = await StudyScheduleService.generateStudySchedule(
        user,
        fullRequest,
        studyProfile,
        useSupabase
      );
      
      setCurrentSchedule(scheduleResponse.schedule);
      
      logger.debug('[useStudySchedule] Study schedule generated successfully', {
        sessionCount: scheduleResponse.schedule.study_sessions.length,
        totalHours: scheduleResponse.analytics.total_study_hours
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate study schedule';
      setError(errorMessage);
      logger.error('[useStudySchedule] Error generating study schedule', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, studyProfile, useSupabase]);
  
  /**
   * Update study profile
   */
  const updateStudyProfile = useCallback(async (profile: StudyProfile) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would save to database
      setStudyProfile(profile);
      
      logger.debug('[useStudySchedule] Study profile updated', {
        profileId: profile.id,
        focusDuration: profile.focus_duration_minutes
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update study profile';
      setError(errorMessage);
      logger.error('[useStudySchedule] Error updating study profile', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Update session status and feedback
   */
  const updateSessionStatus = useCallback(async (
    sessionId: string,
    status: StudySession['status'],
    feedback?: any
  ) => {
    if (!currentSchedule) {
      setError('No active schedule');
      return;
    }
    
    try {
      setError(null);
      
      const updatedSessions = currentSchedule.study_sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            status,
            ...feedback,
            actual_start_time: status === 'in_progress' ? new Date().toISOString() : session.actual_start_time,
            actual_end_time: status === 'completed' ? new Date().toISOString() : session.actual_end_time,
            updated_at: new Date().toISOString()
          };
        }
        return session;
      });
      
      const updatedSchedule: StudySchedule = {
        ...currentSchedule,
        study_sessions: updatedSessions,
        updated_at: new Date().toISOString()
      };
      
      setCurrentSchedule(updatedSchedule);
      
      // In a real implementation, this would sync to database
      logger.debug('[useStudySchedule] Session status updated', {
        sessionId,
        status,
        feedback
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session status';
      setError(errorMessage);
      logger.error('[useStudySchedule] Error updating session status', err);
    }
  }, [currentSchedule]);
  
  /**
   * Refresh workload analysis from Canvas tasks
   */
  const refreshFromCanvasTasks = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('[useStudySchedule] Refreshing from Canvas tasks');
      
      // Get latest tasks (which should include Canvas tasks)
      const tasks = await getTasks(user.id, useSupabase);
      
      // Filter for Canvas tasks that might affect the schedule
      const canvasTasks = tasks.filter(task => task.canvas_uid && !task.completed);
      
      logger.debug('[useStudySchedule] Found Canvas tasks for schedule refresh', {
        totalTasks: tasks.length,
        canvasTasks: canvasTasks.length
      });
      
      // Regenerate workload analysis with updated tasks
      await loadWorkloadAnalysis();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh from Canvas tasks';
      setError(errorMessage);
      logger.error('[useStudySchedule] Error refreshing from Canvas tasks', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, useSupabase, loadWorkloadAnalysis]);
  
  /**
   * Get tasks suitable for scheduling
   */
  const getTasksForScheduling = useCallback(async (): Promise<Task[]> => {
    if (!user) return [];
    
    try {
      const tasks = await getTasks(user.id, useSupabase);
      
      // Filter for incomplete tasks with due dates
      return tasks.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        
        // Only include tasks due within the next 30 days
        const dueDate = new Date(task.dueDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        return dueDate <= thirtyDaysFromNow;
      });
      
    } catch (err) {
      logger.error('[useStudySchedule] Error getting tasks for scheduling', err);
      return [];
    }
  }, [user, useSupabase]);
  
  /**
   * Get schedule for specific date range
   */
  const getScheduleForDateRange = useCallback((startDate: Date, endDate: Date): StudySession[] => {
    if (!currentSchedule) return [];
    
    return currentSchedule.study_sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    }).sort((a, b) => {
      // Sort by date, then by start time
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [currentSchedule]);
  
  /**
   * Get upcoming sessions
   */
  const getUpcomingSessions = useCallback((days: number = 7): StudySession[] => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return getScheduleForDateRange(now, futureDate).filter(
      session => session.status === 'scheduled' || session.status === 'rescheduled'
    );
  }, [getScheduleForDateRange]);
  
  /**
   * Get completed sessions
   */
  const getCompletedSessions = useCallback((days: number = 30): StudySession[] => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return getScheduleForDateRange(startDate, endDate).filter(
      session => session.status === 'completed'
    );
  }, [getScheduleForDateRange]);
  
  /**
   * Get schedule statistics
   */
  const getScheduleStats = useCallback(() => {
    if (!currentSchedule) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalStudyHours: 0,
        averageSessionLength: 0,
        completionRate: 0,
        classDistribution: {}
      };
    }
    
    const sessions = currentSchedule.study_sessions;
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalStudyHours = sessions.reduce((sum, s) => sum + s.duration_minutes / 60, 0);
    const averageSessionLength = sessions.length > 0 ? 
      sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions.length : 0;
    
    // Class distribution
    const classDistribution: Record<string, number> = {};
    sessions.forEach(session => {
      const className = classes.find(c => c.id === session.class_id)?.name || session.class_id;
      classDistribution[className] = (classDistribution[className] || 0) + session.duration_minutes / 60;
    });
    
    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalStudyHours,
      averageSessionLength,
      completionRate: sessions.length > 0 ? completedSessions.length / sessions.length : 0,
      classDistribution
    };
  }, [currentSchedule, classes]);
  
  /**
   * Initialize default study profile when user changes
   */
  useEffect(() => {
    if (user && !studyProfile) {
      const defaultProfile: StudyProfile = {
        id: `profile_${user.id}`,
        user_id: user.id,
        preferred_study_times: [
          { day_of_week: 1, start_time: '09:00', end_time: '11:00', productivity_score: 8 },
          { day_of_week: 2, start_time: '14:00', end_time: '16:00', productivity_score: 7 },
          { day_of_week: 3, start_time: '09:00', end_time: '11:00', productivity_score: 8 },
          { day_of_week: 4, start_time: '14:00', end_time: '16:00', productivity_score: 7 },
          { day_of_week: 5, start_time: '10:00', end_time: '12:00', productivity_score: 6 },
        ],
        focus_duration_minutes: 90,
        break_duration_minutes: 15,
        daily_study_limit_hours: 6,
        subject_difficulty_weights: {},
        retention_curve_steepness: 0.3,
        review_interval_multiplier: 1.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setStudyProfile(defaultProfile);
    }
  }, [user, studyProfile]);
  
  /**
   * Auto-load workload analysis when user or classes change
   */
  useEffect(() => {
    if (user && classes.length > 0 && !workloadAnalysis) {
      loadWorkloadAnalysis();
    }
  }, [user, classes, workloadAnalysis, loadWorkloadAnalysis]);
  
  return {
    // Core state
    currentSchedule,
    workloadAnalysis,
    studyProfile,
    
    // UI state
    isLoading,
    error,
    
    // Actions
    loadWorkloadAnalysis,
    generateSchedule,
    updateStudyProfile,
    updateSessionStatus,
    refreshFromCanvasTasks,
    
    // Data
    getTasksForScheduling,
    getScheduleForDateRange,
    getUpcomingSessions,
    getCompletedSessions,
    
    // Analytics
    getScheduleStats
  };
};

export default useStudySchedule;