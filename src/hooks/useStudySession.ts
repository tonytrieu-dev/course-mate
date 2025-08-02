import { useState, useEffect, useCallback } from 'react';
import { studySessionService } from '../services/studySessionService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import type { StudySession, StudySessionInsert, ActiveStudySession, StudyAnalytics } from '../types/database';

export function useStudySession() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveStudySession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);

  // Load active session on mount
  useEffect(() => {
    if (user?.id) {
      loadActiveSession();
    }
  }, [user?.id]);

  const loadActiveSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const session = await studySessionService.getActiveSession(user.id);
      
      if (session) {
        setActiveSession({
          id: session.id,
          subject: session.subject,
          startTime: new Date(session.start_time),
          sessionType: session.session_type,
          taskId: session.task_id || undefined,
          classId: session.class_id || undefined,
          interruptionsCount: session.interruptions_count || 0
        });
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      logger.error('Error loading active session:', err);
      setError('Failed to load active study session');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const startSession = useCallback(async (
    subject: string,
    sessionType: 'focused' | 'review' | 'practice' | 'reading',
    taskId?: string,
    classId?: string
  ) => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    if (activeSession) {
      setError('A study session is already active');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const sessionData: StudySessionInsert = {
        user_id: user.id,
        subject,
        session_type: sessionType,
        start_time: new Date().toISOString(),
        task_id: taskId,
        class_id: classId,
        interruptions_count: 0
      };

      const session = await studySessionService.createSession(sessionData);
      
      if (session) {
        setActiveSession({
          id: session.id,
          subject: session.subject,
          startTime: new Date(session.start_time),
          sessionType: session.session_type,
          taskId: session.task_id || undefined,
          classId: session.class_id || undefined,
          interruptionsCount: session.interruptions_count || 0
        });
        
        logger.info('Study session started:', session.id);
        return true;
      } else {
        setError('Failed to create study session');
        return false;
      }
    } catch (err) {
      logger.error('Error starting study session:', err);
      setError('Failed to start study session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeSession]);

  const endSession = useCallback(async (effectivenessRating?: number, notes?: string) => {
    if (!activeSession) {
      setError('No active study session to end');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const endTime = new Date().toISOString();
      const updatedSession = await studySessionService.endSession(
        activeSession.id,
        endTime,
        effectivenessRating,
        notes
      );

      if (updatedSession) {
        setActiveSession(null);
        logger.info('Study session ended:', activeSession.id);
        return true;
      } else {
        setError('Failed to end study session');
        return false;
      }
    } catch (err) {
      logger.error('Error ending study session:', err);
      setError('Failed to end study session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [activeSession]);

  const addInterruption = useCallback(async () => {
    if (!activeSession) return false;

    try {
      const updatedSession = await studySessionService.updateSession(activeSession.id, {
        interruptions_count: activeSession.interruptionsCount + 1
      });

      if (updatedSession) {
        setActiveSession(prev => prev ? {
          ...prev,
          interruptionsCount: prev.interruptionsCount + 1
        } : null);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Error adding interruption:', err);
      return false;
    }
  }, [activeSession]);

  const loadAnalytics = useCallback(async (days: number = 30) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const analyticsData = await studySessionService.getStudyAnalytics(user.id, days);
      setAnalytics(analyticsData);
    } catch (err) {
      logger.error('Error loading study analytics:', err);
      setError('Failed to load study analytics');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const getSessionDuration = useCallback(() => {
    if (!activeSession) return 0;
    
    const now = new Date();
    const diffMs = now.getTime() - activeSession.startTime.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  }, [activeSession]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    activeSession,
    isLoading,
    error,
    analytics,
    startSession,
    endSession,
    addInterruption,
    loadAnalytics,
    getSessionDuration,
    clearError,
    refreshActiveSession: loadActiveSession
  };
}