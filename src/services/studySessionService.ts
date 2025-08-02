import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import type { StudySession, StudySessionInsert, StudySessionUpdate, StudyAnalytics, SubjectStudyData } from '../types/database';

export class StudySessionService {
  /**
   * Create a new study session
   */
  async createSession(session: StudySessionInsert): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create study session:', error);
        throw error;
      }

      logger.info('Study session created:', data.id);
      return data;
    } catch (error) {
      logger.error('Error creating study session:', error);
      return null;
    }
  }

  /**
   * Update an existing study session
   */
  async updateSession(id: string, updates: StudySessionUpdate): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update study session:', error);
        throw error;
      }

      logger.info('Study session updated:', id);
      return data;
    } catch (error) {
      logger.error('Error updating study session:', error);
      return null;
    }
  }

  /**
   * End a study session
   */
  async endSession(id: string, endTime: string, effectivenessRating?: number, notes?: string): Promise<StudySession | null> {
    try {
      // Get the session to calculate duration
      const { data: session, error: fetchError } = await supabase
        .from('study_sessions')
        .select('start_time')
        .eq('id', id)
        .single();

      if (fetchError) {
        logger.error('Failed to fetch study session:', fetchError);
        throw fetchError;
      }

      // Calculate duration in minutes
      const startTime = new Date(session.start_time);
      const endTimeDate = new Date(endTime);
      const durationMinutes = Math.round((endTimeDate.getTime() - startTime.getTime()) / (1000 * 60));

      const updates: StudySessionUpdate = {
        end_time: endTime,
        duration_minutes: durationMinutes,
        effectiveness_rating: effectivenessRating,
        notes: notes,
        updated_at: new Date().toISOString()
      };

      return this.updateSession(id, updates);
    } catch (error) {
      logger.error('Error ending study session:', error);
      return null;
    }
  }

  /**
   * Get study sessions for a user
   */
  async getUserSessions(userId: string, limit?: number): Promise<StudySession[]> {
    try {
      let query = supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch user study sessions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching user study sessions:', error);
      return [];
    }
  }

  /**
   * Get active study session for a user
   */
  async getActiveSession(userId: string): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        logger.error('Failed to fetch active study session:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      logger.error('Error fetching active study session:', error);
      return null;
    }
  }

  /**
   * Get study analytics for a user
   */
  async getStudyAnalytics(userId: string, days: number = 30): Promise<StudyAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .not('end_time', 'is', null); // Only completed sessions

      if (error) {
        logger.error('Failed to fetch study sessions for analytics:', error);
        throw error;
      }

      return this.calculateAnalytics(sessions || []);
    } catch (error) {
      logger.error('Error fetching study analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Calculate analytics from study sessions
   */
  private calculateAnalytics(sessions: StudySession[]): StudyAnalytics {
    if (sessions.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalStudyTime = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    const averageSessionDuration = totalStudyTime / sessions.length;
    
    // Sessions in the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessionsThisWeek = sessions.filter(session => 
      new Date(session.start_time) >= weekAgo
    ).length;

    // Calculate retention rate (sessions with retention test scores)
    const sessionsWithRetention = sessions.filter(session => session.retention_test_score !== null);
    const retentionRate = sessionsWithRetention.length > 0 
      ? sessionsWithRetention.reduce((sum, session) => sum + (session.retention_test_score || 0), 0) / sessionsWithRetention.length
      : 0;

    // Calculate effectiveness score
    const sessionsWithEffectiveness = sessions.filter(session => session.effectiveness_rating !== null);
    const effectivenessScore = sessionsWithEffectiveness.length > 0
      ? sessionsWithEffectiveness.reduce((sum, session) => sum + (session.effectiveness_rating || 0), 0) / sessionsWithEffectiveness.length
      : 0;

    // Subject breakdown
    const subjectMap = new Map<string, {
      totalTime: number;
      sessionCount: number;
      effectivenessRatings: number[];
      retentionScores: number[];
      lastStudied: string;
    }>();

    sessions.forEach(session => {
      const subject = session.subject;
      const existing = subjectMap.get(subject) || {
        totalTime: 0,
        sessionCount: 0,
        effectivenessRatings: [],
        retentionScores: [],
        lastStudied: session.start_time
      };

      existing.totalTime += session.duration_minutes || 0;
      existing.sessionCount += 1;
      if (session.effectiveness_rating !== null) {
        existing.effectivenessRatings.push(session.effectiveness_rating);
      }
      if (session.retention_test_score !== null) {
        existing.retentionScores.push(session.retention_test_score);
      }
      if (new Date(session.start_time) > new Date(existing.lastStudied)) {
        existing.lastStudied = session.start_time;
      }

      subjectMap.set(subject, existing);
    });

    const subjectBreakdown: SubjectStudyData[] = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      totalTime: data.totalTime,
      sessionCount: data.sessionCount,
      averageEffectiveness: data.effectivenessRatings.length > 0 
        ? data.effectivenessRatings.reduce((a, b) => a + b, 0) / data.effectivenessRatings.length 
        : 0,
      retentionScore: data.retentionScores.length > 0
        ? data.retentionScores.reduce((a, b) => a + b, 0) / data.retentionScores.length
        : 0,
      lastStudied: data.lastStudied
    }));

    // Weekly trends (simplified - could be enhanced)
    const weeklyTrends = this.calculateWeeklyTrends(sessions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(sessions, subjectBreakdown);

    return {
      totalStudyTime,
      averageSessionDuration,
      sessionsThisWeek,
      retentionRate,
      effectivenessScore,
      subjectBreakdown,
      weeklyTrends,
      recommendations
    };
  }

  private calculateWeeklyTrends(sessions: StudySession[]) {
    const weeklyData = new Map<string, { totalMinutes: number; sessionCount: number; effectivenessRatings: number[] }>();

    sessions.forEach(session => {
      const date = new Date(session.start_time);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weeklyData.get(weekKey) || { totalMinutes: 0, sessionCount: 0, effectivenessRatings: [] };
      existing.totalMinutes += session.duration_minutes || 0;
      existing.sessionCount += 1;
      if (session.effectiveness_rating !== null) {
        existing.effectivenessRatings.push(session.effectiveness_rating);
      }

      weeklyData.set(weekKey, existing);
    });

    return Array.from(weeklyData.entries())
      .map(([date, data]) => ({
        date,
        totalMinutes: data.totalMinutes,
        sessionCount: data.sessionCount,
        averageEffectiveness: data.effectivenessRatings.length > 0
          ? data.effectivenessRatings.reduce((a, b) => a + b, 0) / data.effectivenessRatings.length
          : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private generateRecommendations(sessions: StudySession[], subjectBreakdown: SubjectStudyData[]) {
    const recommendations = [];

    // Check for low effectiveness sessions
    const lowEffectivenessSessions = sessions.filter(s => s.effectiveness_rating && s.effectiveness_rating < 3);
    if (lowEffectivenessSessions.length > sessions.length * 0.3) {
      recommendations.push({
        type: 'session_length' as const,
        message: 'Consider shorter, more focused study sessions to improve effectiveness',
        priority: 'high' as const,
        actionable: true
      });
    }

    // Check for subjects that haven't been studied recently
    const oldStudyThreshold = new Date();
    oldStudyThreshold.setDate(oldStudyThreshold.getDate() - 7);
    
    const neglectedSubjects = subjectBreakdown.filter(subject => 
      new Date(subject.lastStudied) < oldStudyThreshold
    );

    if (neglectedSubjects.length > 0) {
      recommendations.push({
        type: 'review_schedule' as const,
        message: `Consider reviewing: ${neglectedSubjects.map(s => s.subject).join(', ')}`,
        priority: 'medium' as const,
        actionable: true
      });
    }

    // Check average session length
    const avgDuration = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length;
    if (avgDuration > 120) {
      recommendations.push({
        type: 'break_frequency' as const,
        message: 'Consider taking more frequent breaks during long study sessions',
        priority: 'medium' as const,
        actionable: true
      });
    }

    return recommendations;
  }

  private getEmptyAnalytics(): StudyAnalytics {
    return {
      totalStudyTime: 0,
      averageSessionDuration: 0,
      sessionsThisWeek: 0,
      retentionRate: 0,
      effectivenessScore: 0,
      subjectBreakdown: [],
      weeklyTrends: [],
      recommendations: []
    };
  }
}

export const studySessionService = new StudySessionService();