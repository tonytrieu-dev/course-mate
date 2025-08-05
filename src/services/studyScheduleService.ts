import type { User } from '@supabase/supabase-js';
import type { 
  WorkloadAnalysis, 
  StudyProfile, 
  StudySchedule, 
  StudySession,
  WorkloadAnalysisResponse,
  StudyScheduleResponse,
  ClassWorkload,
  ScheduleOptimizationRequest,
  OptimizationGoal
} from '../types/studySchedule';
import type { Task, ClassWithRelations } from '../types/database';
import { getTasks } from './dataService';
import { getClasses } from './class/classOperations';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { supabase } from './supabaseClient';

// AI Analysis via secure Edge Function

/**
 * AI-powered workload analysis service
 * Analyzes Canvas tasks and generates intelligent study recommendations
 */
export class StudyScheduleService {
  
  /**
   * Analyze current workload using AI and Canvas data
   */
  static async analyzeWorkload(
    user: User,
    useSupabase = false
  ): Promise<WorkloadAnalysisResponse> {
    try {
      logger.debug('[StudyScheduleService] Starting workload analysis', { userId: user.id });
      
      // Get current tasks and classes
      const [tasks, classes] = await Promise.all([
        getTasks(user.id, useSupabase),
        getClasses(user.id, useSupabase)
      ]);
      
      // Filter for incomplete tasks and upcoming deadlines (next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const upcomingTasks = tasks.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= thirtyDaysFromNow;
      });
      
      logger.debug('[StudyScheduleService] Filtered tasks', {
        totalTasks: tasks.length,
        upcomingTasks: upcomingTasks.length
      });
      
      // Analyze workload by class
      const classWorkloads = await this.analyzeClassWorkloads(upcomingTasks, classes);
      
      // Get AI analysis of workload
      const aiAnalysis = await this.getAIWorkloadAnalysis(upcomingTasks, classWorkloads);
      
      // Create workload analysis record
      const analysis: WorkloadAnalysis = {
        id: `analysis_${Date.now()}`,
        user_id: user.id,
        analysis_date: new Date().toISOString(),
        total_assignments: upcomingTasks.length,
        upcoming_deadlines: upcomingTasks.filter(task => {
          const dueDate = new Date(task.dueDate!);
          const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
          return dueDate <= sevenDaysFromNow;
        }).length,
        estimated_total_hours: aiAnalysis.estimatedTotalHours,
        class_workloads: classWorkloads,
        stress_level_prediction: aiAnalysis.stressLevel,
        recommended_daily_hours: aiAnalysis.recommendedDailyHours,
        peak_workload_dates: aiAnalysis.peakWorkloadDates,
        canvas_sync_date: new Date().toISOString(),
        ai_model_version: 'gemini-flash-2.5',
        created_at: new Date().toISOString()
      };
      
      return {
        analysis,
        recommendations: aiAnalysis.recommendations,
        risk_factors: {
          overload_risk: aiAnalysis.overloadRisk,
          deadline_conflicts: aiAnalysis.deadlineConflicts,
          burnout_risk: aiAnalysis.burnoutRisk
        }
      };
      
    } catch (error) {
      logger.error('[StudyScheduleService] Error analyzing workload', error);
      const handled = errorHandler.handle(
        error instanceof Error ? error : new Error('Workload analysis failed'),
        'StudyScheduleService.analyzeWorkload'
      );
      throw new Error(handled.userMessage);
    }
  }
  
  /**
   * Generate optimized study schedule based on workload analysis
   */
  static async generateStudySchedule(
    user: User,
    request: ScheduleOptimizationRequest,
    studyProfile?: StudyProfile,
    useSupabase = false
  ): Promise<StudyScheduleResponse> {
    try {
      logger.debug('[StudyScheduleService] Generating study schedule', {
        userId: user.id,
        startDate: request.start_date,
        endDate: request.end_date,
        goals: request.optimization_goals
      });
      
      // Get workload analysis
      const workloadAnalysis = await this.analyzeWorkload(user, useSupabase);
      
      // Get user's study profile or create default
      const profile = studyProfile || this.createDefaultStudyProfile(user.id);
      
      // Generate AI-optimized schedule
      const aiSchedule = await this.generateAISchedule(
        request,
        workloadAnalysis.analysis,
        profile
      );
      
      // Create study schedule record
      const schedule: StudySchedule = {
        id: `schedule_${Date.now()}`,
        user_id: user.id,
        start_date: request.start_date,
        end_date: request.end_date,
        version: 1,
        generated_at: new Date().toISOString(),
        ai_confidence_score: aiSchedule.confidenceScore,
        optimization_method: this.determineOptimizationMethod(request.optimization_goals),
        study_sessions: aiSchedule.sessions,
        adherence_score: 0, // Will be updated as user completes sessions
        effectiveness_score: 0, // Will be updated based on performance
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return {
        schedule,
        analytics: {
          total_study_hours: aiSchedule.totalHours,
          sessions_per_week: aiSchedule.sessionsPerWeek,
          class_time_distribution: aiSchedule.classTimeDistribution,
          predicted_success_rate: aiSchedule.predictedSuccessRate
        },
        recommendations: aiSchedule.recommendations
      };
      
    } catch (error) {
      logger.error('[StudyScheduleService] Error generating study schedule', error);
      const handled = errorHandler.handle(
        error instanceof Error ? error : new Error('Schedule generation failed'),
        'StudyScheduleService.generateStudySchedule'
      );
      throw new Error(handled.userMessage);
    }
  }
  
  /**
   * Analyze workload distribution by class
   */
  private static async analyzeClassWorkloads(
    tasks: Task[],
    classes: ClassWithRelations[]
  ): Promise<ClassWorkload[]> {
    const classWorkloadMap = new Map<string, {
      tasks: Task[];
      class: ClassWithRelations;
    }>();
    
    // Group tasks by class
    tasks.forEach(task => {
      const classId = task.class || 'unassigned';
      const classData = classes.find(c => c.id === classId);
      
      if (!classWorkloadMap.has(classId)) {
        classWorkloadMap.set(classId, {
          tasks: [],
          class: classData || {
            id: classId,
            name: 'Unassigned',
            user_id: '',
            created_at: '',
            files: [],
            syllabus: null
          }
        });
      }
      
      classWorkloadMap.get(classId)!.tasks.push(task);
    });
    
    // Calculate workload metrics for each class
    const classWorkloads: ClassWorkload[] = [];
    
    for (const [classId, data] of Array.from(classWorkloadMap.entries())) {
      const { tasks: classTasks, class: classInfo } = data;
      
      // Calculate estimated hours using AI or heuristics
      const estimatedHours = await this.estimateTaskHours(classTasks);
      
      // Calculate critical deadlines (next 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      const criticalDeadlines = classTasks
        .filter((task: any) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= now && dueDate <= sevenDaysFromNow;
        })
        .map((task: any) => new Date(task.dueDate!));
      
      // Calculate priority score based on deadlines and difficulty
      const priorityScore = this.calculatePriorityScore(classTasks);
      
      classWorkloads.push({
        class_id: classId,
        class_name: classInfo.name,
        pending_assignments: classTasks.length,
        total_estimated_hours: estimatedHours,
        average_assignment_difficulty: this.calculateAverageDifficulty(classTasks),
        recommended_daily_minutes: Math.ceil((estimatedHours * 60) / 14), // Spread over 2 weeks
        priority_score: priorityScore,
        critical_deadlines: criticalDeadlines
      });
    }
    
    return classWorkloads.sort((a, b) => b.priority_score - a.priority_score);
  }
  
  /**
   * Get AI analysis of workload using Google Gemini
   */
  private static async getAIWorkloadAnalysis(
    tasks: Task[],
    classWorkloads: ClassWorkload[]
  ): Promise<{
    estimatedTotalHours: number;
    stressLevel: number;
    recommendedDailyHours: number;
    peakWorkloadDates: string[];
    recommendations: {
      immediate_actions: string[];
      schedule_adjustments: string[];
      long_term_strategies: string[];
    };
    overloadRisk: number;
    deadlineConflicts: number;
    burnoutRisk: number;
  }> {
    try {
      // Prepare task data for AI analysis
      const taskSummary = tasks.map(task => ({
        title: task.title,
        type: task.type,
        dueDate: task.dueDate,
        class: task.class,
        description: (task as any).description?.substring(0, 200) // Limit description length
      }));

      logger.info('[StudyScheduleService] Calling AI Analysis Edge Function for workload analysis');
      
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type: 'schedule_analysis',
          data: {
            tasks: taskSummary,
            classWorkloads: classWorkloads
          },
          config: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        }
      });

      if (error) {
        logger.error('[StudyScheduleService] AI Analysis Edge Function error', error);
        throw new Error(`AI Analysis error: ${error.message}`);
      }

      if (!data || !data.result) {
        throw new Error('Invalid response from AI Analysis service');
      }

      // Parse AI response
      const aiAnalysis = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      
      logger.debug('[StudyScheduleService] AI analysis completed', {
        stressLevel: aiAnalysis.stressLevel,
        totalHours: aiAnalysis.estimatedTotalHours,
        recommendedDaily: aiAnalysis.recommendedDailyHours
      });
      
      return aiAnalysis;
      
    } catch (error) {
      logger.error('[StudyScheduleService] AI analysis failed, using fallback', error);
      return this.getFallbackAnalysis(tasks, classWorkloads);
    }
  }
  
  /**
   * Generate AI-optimized study schedule
   */
  private static async generateAISchedule(
    request: ScheduleOptimizationRequest,
    workloadAnalysis: WorkloadAnalysis,
    studyProfile: StudyProfile
  ): Promise<{
    sessions: StudySession[];
    confidenceScore: number;
    totalHours: number;
    sessionsPerWeek: number;
    classTimeDistribution: Record<string, number>;
    predictedSuccessRate: number;
    recommendations: string[];
  }> {
    // Use fallback schedule generation for now
    // TODO: Implement AI-powered schedule generation via Edge Function
    logger.info('[StudyScheduleService] Using fallback schedule generation (secure AI implementation pending)');
    return this.getFallbackSchedule(request, workloadAnalysis, studyProfile);
  }
  
  /**
   * Fallback analysis when AI is not available
   */
  private static getFallbackAnalysis(
    tasks: Task[],
    classWorkloads: ClassWorkload[]
  ) {
    const totalHours = classWorkloads.reduce((sum, cw) => sum + cw.total_estimated_hours, 0);
    const avgHoursPerDay = totalHours / 14; // Assume 2-week planning window
    
    return {
      estimatedTotalHours: totalHours,
      stressLevel: Math.min(10, Math.max(1, Math.ceil(avgHoursPerDay))),
      recommendedDailyHours: Math.min(8, Math.max(2, Math.ceil(avgHoursPerDay * 1.2))),
      peakWorkloadDates: [], // Would need more complex calculation
      recommendations: {
        immediate_actions: [
          totalHours > 40 ? 'Consider extending deadlines where possible' : 'Maintain current pace',
          'Focus on high-priority assignments first'
        ],
        schedule_adjustments: [
          'Distribute study time evenly across subjects',
          'Schedule regular breaks to avoid burnout'
        ],
        long_term_strategies: [
          'Develop better time management habits',
          'Create a consistent study routine'
        ]
      },
      overloadRisk: totalHours > 60 ? 0.8 : totalHours > 40 ? 0.5 : 0.2,
      deadlineConflicts: 0, // Would need deadline overlap analysis
      burnoutRisk: avgHoursPerDay > 6 ? 0.7 : avgHoursPerDay > 4 ? 0.4 : 0.1
    };
  }
  
  /**
   * Fallback schedule generation when AI is not available
   */
  private static getFallbackSchedule(
    request: ScheduleOptimizationRequest,
    workloadAnalysis: WorkloadAnalysis,
    studyProfile: StudyProfile
  ) {
    // Simple schedule generation based on class workloads and study preferences
    const sessions: StudySession[] = [];
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Distribute workload across available days
    const dailyHours = Math.min(
      studyProfile.daily_study_limit_hours,
      workloadAnalysis.estimated_total_hours / totalDays * 1.2
    );
    
    // Create basic sessions for each study time preference
    let sessionId = 0;
    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate.getTime() + (day * 24 * 60 * 60 * 1000));
      const dayOfWeek = currentDate.getDay();
      
      // Find study preferences for this day
      const dayPrefs = studyProfile.preferred_study_times.filter(pref => pref.day_of_week === dayOfWeek);
      
      for (const pref of dayPrefs) {
        if (sessions.length >= 100) break; // Reasonable limit
        
        // Select class based on priority
        const classWorkload = workloadAnalysis.class_workloads[sessionId % workloadAnalysis.class_workloads.length];
        
        sessions.push({
          id: `fallback_session_${sessionId++}`,
          schedule_id: '',
          date: currentDate.toISOString().split('T')[0],
          start_time: pref.start_time,
          end_time: this.addMinutesToTime(pref.start_time, studyProfile.focus_duration_minutes),
          duration_minutes: studyProfile.focus_duration_minutes,
          class_id: classWorkload.class_id,
          task_ids: [],
          session_type: 'practice',
          focus_area: `Study ${classWorkload.class_name}`,
          difficulty_level: Math.ceil(classWorkload.average_assignment_difficulty),
          prerequisite_concepts: [],
          learning_objectives: [`Complete assignments for ${classWorkload.class_name}`],
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    const totalHours = sessions.reduce((sum, s) => sum + s.duration_minutes / 60, 0);
    const classTimeDistribution: Record<string, number> = {};
    sessions.forEach(session => {
      classTimeDistribution[session.class_id] = 
        (classTimeDistribution[session.class_id] || 0) + session.duration_minutes / 60;
    });
    
    return {
      sessions: sessions.slice(0, 50), // Limit sessions
      confidenceScore: 0.6,
      totalHours,
      sessionsPerWeek: sessions.length / (totalDays / 7),
      classTimeDistribution,
      predictedSuccessRate: 0.7,
      recommendations: [
        'This is a basic schedule. Consider upgrading to premium for AI-optimized scheduling.',
        'Adjust session times based on your productivity patterns.',
        'Take regular breaks to maintain focus.'
      ]
    };
  }
  
  /**
   * Helper methods
   */
  private static async estimateTaskHours(tasks: Task[]): Promise<number> {
    // Simple heuristic-based hour estimation
    return tasks.reduce((total, task) => {
      const baseHours = this.getBaseHoursForTaskType(task.type || 'assignment');
      const complexityMultiplier = (task as any).description?.length ? 
        Math.min(2, 1 + ((task as any).description.length / 1000)) : 1;
      return total + (baseHours * complexityMultiplier);
    }, 0);
  }
  
  private static getBaseHoursForTaskType(taskType: string): number {
    const typeHours: Record<string, number> = {
      'exam': 8,
      'project': 12,
      'paper': 6,
      'assignment': 3,
      'homework': 2,
      'quiz': 1,
      'discussion': 1,
      'reading': 2,
      'lab': 4,
      'presentation': 4,
      'research': 6
    };
    return typeHours[taskType] || 3;
  }
  
  private static calculatePriorityScore(tasks: Task[]): number {
    const now = new Date();
    return tasks.reduce((score, task) => {
      if (!task.dueDate) return score;
      
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Higher score for sooner deadlines
      const urgencyScore = Math.max(0, 10 - daysUntilDue / 3);
      const importanceScore = this.getBaseHoursForTaskType(task.type || 'assignment');
      
      return score + (urgencyScore * importanceScore);
    }, 0);
  }
  
  private static calculateAverageDifficulty(tasks: Task[]): number {
    if (tasks.length === 0) return 3;
    
    const difficulties = tasks.map(task => this.estimateTaskDifficulty(task));
    return difficulties.reduce((sum, diff) => sum + diff, 0) / difficulties.length;
  }
  
  private static estimateTaskDifficulty(task: Task): number {
    const typeDifficulties: Record<string, number> = {
      'exam': 5,
      'project': 4,
      'paper': 4,
      'research': 4,
      'assignment': 3,
      'homework': 2,
      'lab': 3,
      'presentation': 3,
      'quiz': 2,
      'discussion': 1,
      'reading': 2
    };
    return typeDifficulties[task.type || 'assignment'] || 3;
  }
  
  private static createDefaultStudyProfile(userId: string): StudyProfile {
    return {
      id: `profile_${userId}`,
      user_id: userId,
      preferred_study_times: [
        { day_of_week: 1, start_time: '09:00', end_time: '11:00', productivity_score: 8 }, // Monday
        { day_of_week: 2, start_time: '14:00', end_time: '16:00', productivity_score: 7 }, // Tuesday
        { day_of_week: 3, start_time: '09:00', end_time: '11:00', productivity_score: 8 }, // Wednesday
        { day_of_week: 4, start_time: '14:00', end_time: '16:00', productivity_score: 7 }, // Thursday
        { day_of_week: 5, start_time: '10:00', end_time: '12:00', productivity_score: 6 }, // Friday
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
  }
  
  private static determineOptimizationMethod(goals: OptimizationGoal[]): 'balanced' | 'deadline_focused' | 'retention_optimized' {
    if (goals.includes('maximize_retention')) return 'retention_optimized';
    if (goals.includes('meet_deadlines')) return 'deadline_focused';
    return 'balanced';
  }
  
  private static addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
}