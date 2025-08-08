import type {
  StudySession,
  StudyProfile,
  WorkloadAnalysis,
  ClassWorkload,
  OptimizationGoal,
  StudyTimePreference
} from '../types/studySchedule';
import type { Task } from '../types/database';
import { logger } from './logger';

/**
 * Utility functions for schedule optimization
 * Contains helper functions, calculations, and optimization support methods
 */
export class OptimizationUtils {
  
  /**
   * Apply various optimization passes to improve schedule quality
   */
  static applyOptimizations(sessions: StudySession[], context: any): StudySession[] {
    logger.debug('[OptimizationUtils] Applying optimization passes', {
      sessionCount: sessions.length
    });
    
    // Apply multiple optimization passes
    sessions = this.resolveTimeConflicts(sessions);
    sessions = this.optimizeSessionSequencing(sessions, context);
    sessions = this.applyCognitiveLoadBalancing(sessions, context);
    sessions = this.addStrategicBreaks(sessions, context.studyProfile);
    sessions = this.applyFinalOptimizations(sessions, context);
    
    return sessions;
  }
  
  /**
   * Validate and adjust schedule to ensure feasibility and quality
   */
  static validateAndAdjustSchedule(sessions: StudySession[], context: any): StudySession[] {
    logger.debug('[OptimizationUtils] Validating and adjusting schedule', {
      sessionCount: sessions.length
    });
    
    // Apply validation and adjustment passes
    sessions = this.enforceStudyTimeLimits(sessions, context.studyProfile);
    sessions = this.enforceRecoveryTime(sessions, context.studyProfile);
    sessions = this.balanceWeeklyWorkload(sessions, context);
    sessions = this.performQualityChecks(sessions, context);
    
    return sessions;
  }
  
  /**
   * Calculate available study hours within the specified date range
   */
  static calculateAvailableStudyHours(
    startDate: Date,
    endDate: Date,
    studyProfile: StudyProfile
  ): number {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let totalHours = 0;
    
    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate.getTime() + (day * 24 * 60 * 60 * 1000));
      const dayOfWeek = currentDate.getDay();
      
      const dayPreferences = studyProfile.preferred_study_times.filter(
        pref => pref.day_of_week === dayOfWeek
      );
      
      totalHours += dayPreferences.reduce((sum, pref) => {
        return sum + this.getTimeDifferenceInHours(pref.start_time, pref.end_time);
      }, 0);
    }
    
    return totalHours;
  }
  
  /**
   * Get time difference in hours between two time strings
   */
  static getTimeDifferenceInHours(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    return (endTotalMinutes - startTotalMinutes) / 60;
  }
  
  /**
   * Calculate number of weeks between two dates
   */
  static getWeeksBetween(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays / 7;
  }
  
  /**
   * Add minutes to a time string (HH:MM format)
   */
  static addMinutesToTime(time: string, minutes: number): string {
    const [hour, minute] = time.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + minutes;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;
    
    return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
  }
  
  /**
   * Determine the primary optimization goal from a list of goals
   */
  static determinePrimaryGoal(goals: OptimizationGoal[]): OptimizationGoal {
    if (!goals || goals.length === 0) {
      return 'balance_subjects';
    }
    
    // Priority order for goal selection
    const goalPriority: Record<OptimizationGoal, number> = {
      'meet_deadlines': 5,
      'minimize_stress': 4,
      'maximize_retention': 3,
      'focus_difficult': 2,
      'balance_subjects': 1
    };
    
    return goals.reduce((primary, current) => {
      return goalPriority[current] > goalPriority[primary] ? current : primary;
    });
  }
  
  /**
   * Calculate optimal session length based on productivity score and difficulty
   */
  static calculateOptimalSessionLength(productivityScore: number, difficulty: number): number {
    const baseDuration = 60; // Base duration in minutes
    const productivityMultiplier = 0.5 + (productivityScore * 0.5); // 0.5 to 1.0
    const difficultyMultiplier = 0.7 + (difficulty * 0.6); // 0.7 to 1.3
    
    return Math.round(baseDuration * productivityMultiplier * difficultyMultiplier);
  }

  /**
   * Create a study session with all required properties
   */
  static createStudySession(
    date: Date,
    pref: StudyTimePreference,
    sessionContent: any,
    studyProfile: StudyProfile,
    index: number
  ): StudySession {
    const startTime = pref.start_time;
    const endTime = pref.end_time;
    const duration = this.getTimeDifferenceInHours(startTime, endTime) * 60; // Convert to minutes
    
    return {
      id: `session-${Date.now()}-${index}`,
      schedule_id: `schedule-${Date.now()}`,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      class_id: sessionContent?.class_id || sessionContent?.id || '',
      task_ids: [],
      session_type: 'new_material',
      focus_area: sessionContent?.class_name || 'General Study',
      difficulty_level: 3, // Default medium difficulty
      prerequisite_concepts: [],
      learning_objectives: [],
      status: 'scheduled' as const,
      notes: this.generateSessionNotes(sessionContent, pref),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // Private helper methods for optimization passes
  private static resolveTimeConflicts(sessions: StudySession[]): StudySession[] {
    // Sort sessions by start time
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(`${a.date} ${a.start_time}`).getTime() - new Date(`${b.date} ${b.start_time}`).getTime()
    );
    
    const resolvedSessions: StudySession[] = [];
    
    for (const session of sortedSessions) {
      const sessionStart = new Date(`${session.date} ${session.start_time}`);
      const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
      
      // Check for conflicts with already scheduled sessions
      const hasConflict = resolvedSessions.some(existing => {
        const existingStart = new Date(`${existing.date} ${existing.start_time}`);
        const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60000);
        
        return (sessionStart < existingEnd && sessionEnd > existingStart);
      });
      
      if (!hasConflict) {
        resolvedSessions.push(session);
      } else {
        // Try to reschedule to next available slot
        const rescheduled = this.rescheduleSession(session, resolvedSessions);
        if (rescheduled) {
          resolvedSessions.push(rescheduled);
        }
      }
    }
    
    return resolvedSessions;
  }
  
  private static optimizeSessionSequencing(sessions: StudySession[], context: any): StudySession[] {
    // Group sessions by day
    const sessionsByDay = this.groupSessionsByDay(sessions);
    
    const optimizedSessions: StudySession[] = [];
    
    for (const [day, daySessions] of Array.from(sessionsByDay.entries())) {
      // Sort by difficulty for optimal cognitive load distribution
      const sortedDaySessions = this.sortSessionsByOptimalSequence(daySessions, context);
      optimizedSessions.push(...sortedDaySessions);
    }
    
    return optimizedSessions;
  }
  
  private static applyCognitiveLoadBalancing(sessions: StudySession[], context: any): StudySession[] {
    // Ensure no day has excessive cognitive load
    const maxDailyHours = context.studyProfile.daily_study_limit_hours || 8;
    
    return sessions.filter((session, index, arr) => {
      const sessionDate = new Date(session.date).toDateString();
      const dayTotal = arr
        .filter(s => new Date(s.date).toDateString() === sessionDate)
        .reduce((sum, s) => sum + s.duration_minutes / 60, 0);
      
      return dayTotal <= maxDailyHours;
    });
  }
  
  private static addStrategicBreaks(sessions: StudySession[], studyProfile: StudyProfile): StudySession[] {
    const minBreakBetweenSessions = studyProfile.break_duration_minutes || 15; // minutes
    
    return sessions.map((session, index, arr) => {
      if (index < arr.length - 1) {
        const currentEnd = new Date(`${session.date} ${session.start_time}`).getTime() + session.duration_minutes * 60000;
        const nextStart = new Date(`${arr[index + 1].date} ${arr[index + 1].start_time}`).getTime();
        
        // If gap is too small, extend break by adjusting next session
        if (nextStart - currentEnd < minBreakBetweenSessions * 60000) {
          const adjustedNextStart = new Date(currentEnd + minBreakBetweenSessions * 60000);
          const adjustedTime = adjustedNextStart.toTimeString().slice(0, 5);
          arr[index + 1] = {
            ...arr[index + 1],
            start_time: adjustedTime
          };
        }
      }
      
      return session;
    });
  }
  
  private static applyFinalOptimizations(sessions: StudySession[], context: any): StudySession[] {
    // Apply any final optimizations and cleanup
    return sessions
      .filter(session => session.duration_minutes >= 15) // Minimum viable session length
      .map(session => ({
        ...session,
        notes: this.enhanceSessionNotes(session, context)
      }));
  }
  
  private static enforceStudyTimeLimits(sessions: StudySession[], studyProfile: StudyProfile): StudySession[] {
    const maxSessionLength = studyProfile.focus_duration_minutes * 2 || 180; // 2x focus duration default
    const minSessionLength = studyProfile.break_duration_minutes || 15; // break duration as minimum
    
    return sessions
      .filter(session => session.duration_minutes >= minSessionLength)
      .map(session => ({
        ...session,
        duration_minutes: Math.min(session.duration_minutes, maxSessionLength)
      }));
  }
  
  private static enforceRecoveryTime(sessions: StudySession[], studyProfile: StudyProfile): StudySession[] {
    const minRecoveryTime = studyProfile.break_duration_minutes * 2 || 60; // double break duration for recovery
    
    return sessions.filter((session, index, arr) => {
      if (index === 0) return true;
      
      const prevSession = arr[index - 1];
      const prevEnd = new Date(`${prevSession.date} ${prevSession.start_time}`).getTime() + prevSession.duration_minutes * 60000;
      const currentStart = new Date(`${session.date} ${session.start_time}`).getTime();
      
      // Check if both sessions are intensive
      const prevIntensive = prevSession.duration_minutes > 90;
      const currentIntensive = session.duration_minutes > 90;
      
      if (prevIntensive && currentIntensive) {
        return currentStart - prevEnd >= minRecoveryTime * 60000;
      }
      
      return true;
    });
  }
  
  private static balanceWeeklyWorkload(sessions: StudySession[], context: any): StudySession[] {
    const maxWeeklyHours = context.studyProfile.daily_study_limit_hours * 7 || 40;
    const sessionsByWeek = this.groupSessionsByWeek(sessions);
    
    const balancedSessions: StudySession[] = [];
    
    for (const [week, weekSessions] of Array.from(sessionsByWeek.entries())) {
      const weekTotal = weekSessions.reduce((sum, s) => sum + s.duration_minutes / 60, 0);
      
      if (weekTotal <= maxWeeklyHours) {
        balancedSessions.push(...weekSessions);
      } else {
        // Proportionally reduce session durations
        const reductionFactor = maxWeeklyHours / weekTotal;
        const adjustedSessions = weekSessions.map(session => ({
          ...session,
          duration_minutes: Math.max(15, Math.round(session.duration_minutes * reductionFactor))
        }));
        balancedSessions.push(...adjustedSessions);
      }
    }
    
    return balancedSessions;
  }
  
  private static performQualityChecks(sessions: StudySession[], context: any): StudySession[] {
    // Final quality checks and adjustments
    return sessions.filter(session => {
      // Ensure session is within the planning period
      const sessionDate = new Date(session.date);
      return sessionDate >= context.startDate && sessionDate <= context.endDate;
    });
  }
  
  // Additional helper methods
  private static rescheduleSession(session: StudySession, existingSessions: StudySession[]): StudySession | null {
    // Try to find next available slot (simplified implementation)
    const sessionStart = new Date(`${session.date} ${session.start_time}`);
    const nextHour = new Date(sessionStart.getTime() + 60 * 60000); // Try next hour
    
    return {
      ...session,
      start_time: nextHour.toTimeString().slice(0, 5)
    };
  }
  
  private static groupSessionsByDay(sessions: StudySession[]): Map<string, StudySession[]> {
    const groups = new Map<string, StudySession[]>();
    
    sessions.forEach(session => {
      const day = new Date(session.date).toDateString();
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day)!.push(session);
    });
    
    return groups;
  }
  
  private static groupSessionsByWeek(sessions: StudySession[]): Map<number, StudySession[]> {
    const groups = new Map<number, StudySession[]>();
    
    sessions.forEach(session => {
      const date = new Date(session.date);
      const weekNumber = this.getWeekNumber(date);
      
      if (!groups.has(weekNumber)) {
        groups.set(weekNumber, []);
      }
      groups.get(weekNumber)!.push(session);
    });
    
    return groups;
  }
  
  private static getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }
  
  private static sortSessionsByOptimalSequence(sessions: StudySession[], context: any): StudySession[] {
    // Sort sessions for optimal cognitive load distribution
    return sessions.sort((a, b) => {
      const aTime = new Date(`${a.date} ${a.start_time}`).getHours();
      const bTime = new Date(`${b.date} ${b.start_time}`).getHours();
      
      // Morning sessions should prioritize difficult subjects
      if (aTime < 12 && bTime < 12) {
        return b.duration_minutes - a.duration_minutes; // Longer sessions first in morning
      }
      
      // Afternoon sessions can be more balanced
      return new Date(`${a.date} ${a.start_time}`).getTime() - new Date(`${b.date} ${b.start_time}`).getTime();
    });
  }
  
  private static determineSessionType(sessionContent: any, pref: StudyTimePreference): 'new_material' | 'review' | 'practice' {
    if (pref.productivity_score > 0.8) {
      return 'new_material';
    } else if (pref.productivity_score > 0.5) {
      return 'practice';
    }
    return 'review';
  }
  
  private static generateSessionNotes(sessionContent: any, pref: StudyTimePreference): string {
    const className = sessionContent?.class_name || sessionContent?.name || 'Study Session';
    const timeQuality = pref.productivity_score > 0.7 ? 'high-focus' : 'regular';
    const prefDurationMinutes = this.getTimeDifferenceInHours(pref.start_time, pref.end_time) * 60;
    return `${className} - ${timeQuality} session (${prefDurationMinutes} min)`;
  }
  
  private static enhanceSessionNotes(session: StudySession, context: any): string {
    const baseNotes = session.notes || '';
    const sessionDate = new Date(session.date);
    const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${baseNotes} - Scheduled for ${dayOfWeek}`;
  }
}