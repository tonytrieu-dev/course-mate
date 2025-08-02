// Study Schedule Optimizer - Type Definitions

export interface StudyProfile {
  id: string;
  user_id: string;
  
  // Learning preferences
  preferred_study_times: StudyTimePreference[];
  focus_duration_minutes: number; // Default focus session length
  break_duration_minutes: number; // Break between sessions
  daily_study_limit_hours: number; // Maximum hours willing to study per day
  
  // Subject difficulty weights (1-5 scale)
  subject_difficulty_weights: Record<string, number>; // classId -> difficulty rating
  
  // Retention curve parameters
  retention_curve_steepness: number; // How quickly student forgets (0-1)
  review_interval_multiplier: number; // How much to increase interval after successful review
  
  created_at: string;
  updated_at: string;
}

export interface StudyTimePreference {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  productivity_score: number; // 1-10 scale, how productive during this time
}

export interface WorkloadAnalysis {
  id: string;
  user_id: string;
  analysis_date: string;
  
  // Canvas data analysis
  total_assignments: number;
  upcoming_deadlines: number;
  estimated_total_hours: number;
  
  // Workload distribution by class
  class_workloads: ClassWorkload[];
  
  // AI analysis results
  stress_level_prediction: number; // 1-10 scale
  recommended_daily_hours: number;
  peak_workload_dates: string[]; // Dates with highest workload
  
  // Metadata
  canvas_sync_date: string;
  ai_model_version: string;
  created_at: string;
}

export interface ClassWorkload {
  class_id: string;
  class_name: string;
  
  // Assignment analysis
  pending_assignments: number;
  total_estimated_hours: number;
  average_assignment_difficulty: number; // 1-5 scale
  
  // Time allocation
  recommended_daily_minutes: number;
  priority_score: number; // Higher = more urgent
  
  // Upcoming deadlines (next 14 days)
  critical_deadlines: Date[];
}

export interface StudySchedule {
  id: string;
  user_id: string;
  
  // Schedule metadata
  start_date: string;
  end_date: string;
  version: number; // For tracking schedule updates
  
  // AI generation metadata
  generated_at: string;
  ai_confidence_score: number; // 0-1, how confident AI is in schedule
  optimization_method: 'balanced' | 'deadline_focused' | 'retention_optimized';
  
  // Schedule data
  study_sessions: StudySession[];
  
  // Performance tracking
  adherence_score: number; // 0-1, how well user followed schedule
  effectiveness_score: number; // 0-1, how effective the schedule was
  
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  schedule_id: string;
  
  // Session details
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  
  // Content details
  class_id: string;
  task_ids: string[]; // Related tasks for this session
  session_type: StudySessionType;
  focus_area: string; // What to focus on during this session
  
  // AI recommendations
  difficulty_level: number; // 1-5 scale
  prerequisite_concepts: string[]; // What to review before this session
  learning_objectives: string[]; // What should be accomplished
  
  // Tracking
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  actual_start_time?: string;
  actual_end_time?: string;
  actual_duration_minutes?: number;
  
  // User feedback
  difficulty_rating?: number; // 1-5 scale, how difficult it was
  effectiveness_rating?: number; // 1-5 scale, how effective it was
  focus_quality?: number; // 1-5 scale, how well they focused
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

export type StudySessionType = 
  | 'new_material'     // Learning new concepts
  | 'review'           // Reviewing previously learned material
  | 'practice'         // Working on assignments/homework
  | 'exam_prep'        // Exam preparation
  | 'project_work'     // Working on projects
  | 'break_recovery';  // Light review after breaks

export interface ScheduleOptimizationRequest {
  user_id: string;
  
  // Time constraints
  start_date: string;
  end_date: string;
  
  // Preferences
  optimization_goals: OptimizationGoal[];
  include_classes: string[]; // Class IDs to include, empty = all
  exclude_dates: string[]; // Dates to avoid scheduling
  
  // Overrides
  force_regenerate: boolean; // Ignore existing schedule
  preserve_completed_sessions: boolean; // Keep completed sessions when regenerating
}

export type OptimizationGoal = 
  | 'minimize_stress'      // Spread workload evenly
  | 'maximize_retention'   // Optimize for spaced repetition
  | 'meet_deadlines'       // Prioritize upcoming deadlines
  | 'balance_subjects'     // Equal time for all subjects
  | 'focus_difficult';     // More time on difficult subjects

export interface RetentionAnalytics {
  id: string;
  user_id: string;
  class_id: string;
  
  // Retention metrics
  concept_retention_rates: ConceptRetention[];
  optimal_review_intervals: Record<string, number>; // concept -> days
  forgetting_curve_data: ForgettingCurvePoint[];
  
  // Performance tracking
  quiz_performance_trend: PerformancePoint[];
  assignment_completion_rate: number;
  average_grade_improvement: number;
  
  // Recommendations
  struggling_concepts: string[];
  recommended_review_frequency: Record<string, number>; // concept -> times per week
  
  last_updated: string;
  created_at: string;
}

export interface ConceptRetention {
  concept_name: string;
  initial_learning_date: string;
  last_review_date: string;
  retention_strength: number; // 0-1 scale
  optimal_next_review: string; // Predicted optimal review date
}

export interface ForgettingCurvePoint {
  days_since_learning: number;
  retention_percentage: number; // 0-100
}

export interface PerformancePoint {
  date: string;
  score: number; // 0-100
  topic: string;
}

// API Response Types
export interface StudyScheduleResponse {
  schedule: StudySchedule;
  analytics: {
    total_study_hours: number;
    sessions_per_week: number;
    class_time_distribution: Record<string, number>;
    predicted_success_rate: number;
  };
  recommendations: string[];
}

export interface WorkloadAnalysisResponse {
  analysis: WorkloadAnalysis;
  recommendations: {
    immediate_actions: string[];
    schedule_adjustments: string[];
    long_term_strategies: string[];
  };
  risk_factors: {
    overload_risk: number; // 0-1 scale
    deadline_conflicts: number;
    burnout_risk: number; // 0-1 scale
  };
}

// UI State Types
export interface StudyScheduleUIState {
  selectedWeek: Date;
  viewMode: 'week' | 'month' | 'agenda';
  showCompleted: boolean;
  selectedSession: StudySession | null;
  
  // Filters
  classFilter: string[]; // Class IDs to show
  sessionTypeFilter: StudySessionType[];
  
  // Analytics panel
  showAnalytics: boolean;
  analyticsTimeRange: '1week' | '1month' | '3months' | 'semester';
}

export interface ScheduleGenerationStatus {
  status: 'idle' | 'analyzing' | 'generating' | 'optimizing' | 'complete' | 'error';
  progress: number; // 0-100
  current_step: string;
  estimated_completion: string; // ISO timestamp
  error_message?: string;
}

// Premium Feature Gating
export interface StudyScheduleFeatureLimits {
  max_sessions_per_week: number;
  max_classes_analyzed: number;
  ai_recommendations_enabled: boolean;
  retention_analytics_enabled: boolean;
  advanced_optimization_enabled: boolean;
  export_formats: ('pdf' | 'ical' | 'csv')[];
}