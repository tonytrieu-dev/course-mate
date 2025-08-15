import type { Database } from '../services/supabaseClient';

// Database table types
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type Class = Database['public']['Tables']['classes']['Row'];
export type ClassInsert = Database['public']['Tables']['classes']['Insert'];
export type ClassUpdate = Database['public']['Tables']['classes']['Update'];

export type TaskType = Database['public']['Tables']['task_types']['Row'] & {
  completedColor?: string;
};
export type TaskTypeInsert = Database['public']['Tables']['task_types']['Insert'] & {
  completedColor?: string;
};
export type TaskTypeUpdate = Database['public']['Tables']['task_types']['Update'] & {
  completedColor?: string;
};

export type ClassFile = Database['public']['Tables']['class_files']['Row'];
export type ClassFileInsert = Database['public']['Tables']['class_files']['Insert'];
export type ClassFileUpdate = Database['public']['Tables']['class_files']['Update'];

export type ClassSyllabus = Database['public']['Tables']['class_syllabi']['Row'];
export type ClassSyllabusInsert = Database['public']['Tables']['class_syllabi']['Insert'];
export type ClassSyllabusUpdate = Database['public']['Tables']['class_syllabi']['Update'];

export type NotificationSettings = Database['public']['Tables']['notification_settings']['Row'];
export type NotificationSettingsInsert = Database['public']['Tables']['notification_settings']['Insert'];
export type NotificationSettingsUpdate = Database['public']['Tables']['notification_settings']['Update'];

export type EmailNotification = Database['public']['Tables']['email_notifications']['Row'];
export type EmailNotificationInsert = Database['public']['Tables']['email_notifications']['Insert'];
export type EmailNotificationUpdate = Database['public']['Tables']['email_notifications']['Update'];

export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];

export type Grade = Database['public']['Tables']['grades']['Row'];
export type GradeInsert = Database['public']['Tables']['grades']['Insert'];
export type GradeUpdate = Database['public']['Tables']['grades']['Update'];

export type GradeCategory = Database['public']['Tables']['grade_categories']['Row'];
export type GradeCategoryInsert = Database['public']['Tables']['grade_categories']['Insert'];
export type GradeCategoryUpdate = Database['public']['Tables']['grade_categories']['Update'];

export type GpaSettings = Database['public']['Tables']['gpa_settings']['Row'];
export type GpaSettingsInsert = Database['public']['Tables']['gpa_settings']['Insert'];
export type GpaSettingsUpdate = Database['public']['Tables']['gpa_settings']['Update'];

export type ClassGpaInfo = Database['public']['Tables']['class_gpa_info']['Row'];
export type ClassGpaInfoInsert = Database['public']['Tables']['class_gpa_info']['Insert'];
export type ClassGpaInfoUpdate = Database['public']['Tables']['class_gpa_info']['Update'];

export type StudySession = Database['public']['Tables']['study_sessions']['Row'];
export type StudySessionInsert = Database['public']['Tables']['study_sessions']['Insert'];
export type StudySessionUpdate = Database['public']['Tables']['study_sessions']['Update'];

// Extended types that include joined data
export interface ClassWithRelations extends Omit<Class, 'istaskclass'> {
  isTaskClass?: boolean;
  files: ClassFile[];
  syllabus: ClassSyllabus | null;
}

// Extended Task interface with calendar-specific properties
export interface TaskWithMeta extends Task {
  // Additional calendar-specific properties
  description?: string;
  class?: string;
  isDuration?: boolean;
  startTime?: string;
  endTime?: string;
  dueTime?: string;
  dueDate?: string;
  date?: string;
}

// Extended Assignment interface with relations
export interface AssignmentWithGrade extends Assignment {
  grade?: Grade;
  category: GradeCategory;
}

// Extended Class interface with grade info
export interface ClassWithGrades extends Class {
  assignments: AssignmentWithGrade[];
  categories: GradeCategory[];
  gpaInfo?: ClassGpaInfo;
  currentGrade?: number;
  currentLetterGrade?: string;
}

// GPA calculation interfaces
export interface GPACalculation {
  currentGPA: number;
  cumulativeGPA: number;
  totalCreditHours: number;
  totalQualityPoints: number;
  semesterGPA: number;
  classGrades: ClassGradeInfo[];
}

export interface ClassGradeInfo {
  classId: string;
  className: string;
  currentGrade: number;
  letterGrade: string;
  creditHours: number;
  qualityPoints: number;
  isCompleted: boolean;
}

// What-if scenario interface
export interface WhatIfScenario {
  scenarioName: string;
  changes: GradeChange[];
  resultingGPA: number;
  gpaChange: number;
}

export interface GradeChange {
  assignmentId: string;
  assignmentName: string;
  className: string;
  currentGrade?: number;
  newGrade: number;
  pointsEarned: number;
  pointsPossible: number;
}

// Grade analytics interfaces
export interface GradeAnalytics {
  classPerformance: ClassPerformance[];
  trendAnalysis: GradeTrend[];
  recommendations: string[];
}

export interface ClassPerformance {
  classId: string;
  className: string;
  averageGrade: number;
  trend: 'improving' | 'declining' | 'stable';
  strongCategories: string[];
  weakCategories: string[];
}

export interface GradeTrend {
  date: string;
  gpa: number;
  semester: string;
}

// Study session analytics interfaces
export interface StudyAnalytics {
  totalStudyTime: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  retentionRate: number;
  effectivenessScore: number;
  subjectBreakdown: SubjectStudyData[];
  weeklyTrends: StudyTrend[];
  recommendations: StudyRecommendation[];
}

export interface SubjectStudyData {
  subject: string;
  totalTime: number;
  sessionCount: number;
  averageEffectiveness: number;
  retentionScore: number;
  lastStudied: string;
}

export interface StudyTrend {
  date: string;
  totalMinutes: number;
  sessionCount: number;
  averageEffectiveness: number;
}

export interface StudyRecommendation {
  type: 'time_allocation' | 'session_length' | 'review_schedule' | 'break_frequency';
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface ActiveStudySession {
  id: string;
  subject: string;
  startTime: Date;
  sessionType: 'focused' | 'review' | 'practice' | 'reading';
  taskId?: string;
  classId?: string;
  interruptionsCount: number;
}

// Priority levels
export type Priority = 'low' | 'medium' | 'high';

// Position interface
export interface Position {
  x: number;
  y: number;
}

// Local storage keys
export const STORAGE_KEYS = {
  TASKS: 'calendar_tasks',
  CLASSES: 'calendar_classes',
  TASK_TYPES: 'calendar_task_types',
  SETTINGS: 'calendar_settings',
} as const;

// Element formatting configuration for text elements
export interface ElementFormatting {
  bold?: boolean;
  underline?: boolean;
  fontSize?: number;
}

// Element formatting map (element type -> formatting config)
export interface ElementFormattingMap {
  [elementType: string]: ElementFormatting;
}

// Settings interface
export interface AppSettings {
  title: string;
  classesTitle?: string;
  theme?: 'light' | 'dark' | 'auto';
  fontSize?: number;
  classNamingStyle?: 'technical' | 'descriptive'; // 'technical' = "CS100", 'descriptive' = "Computer Science 100"
  academicSystem?: 'semester' | 'quarter'; // Academic term system preference
  // Navigation preferences
  navigationOrder?: string[]; // Order of navigation items
  selectedView?: 'dashboard' | 'tasks' | 'calendar' | 'grades'; // Currently selected view
  // Sidebar color customization
  titleColor?: string;
  classesHeaderColor?: string;
  // Text formatting configuration
  elementFormatting?: ElementFormattingMap;
  // Add other settings as needed
}