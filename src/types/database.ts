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

// Extended types that include joined data
export interface ClassWithRelations extends Omit<Class, 'istaskclass'> {
  isTaskClass?: boolean;
  files: ClassFile[];
  syllabus: ClassSyllabus | null;
}

// Extended Task interface with calendar-specific properties
export interface TaskWithMeta extends Task {
  // Additional calendar-specific properties
  class?: string;
  isDuration?: boolean;
  startTime?: string;
  endTime?: string;
  dueTime?: string;
  dueDate?: string;
  date?: string;
}

// Priority levels
export type Priority = 'low' | 'medium' | 'high';

// Local storage keys
export const STORAGE_KEYS = {
  TASKS: 'calendar_tasks',
  CLASSES: 'calendar_classes',
  TASK_TYPES: 'calendar_task_types',
  SETTINGS: 'calendar_settings',
} as const;

// Settings interface
export interface AppSettings {
  title: string;
  classesTitle?: string;
  theme?: 'light' | 'dark' | 'auto';
  fontSize?: number;
  classNamingStyle?: 'technical' | 'descriptive'; // 'technical' = "CS100", 'descriptive' = "Computer Science 100"
  // Add other settings as needed
}