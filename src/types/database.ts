import type { Database } from '../services/supabaseClient';

// Database table types
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type Class = Database['public']['Tables']['classes']['Row'];
export type ClassInsert = Database['public']['Tables']['classes']['Insert'];
export type ClassUpdate = Database['public']['Tables']['classes']['Update'];

export type TaskType = Database['public']['Tables']['task_types']['Row'];
export type TaskTypeInsert = Database['public']['Tables']['task_types']['Insert'];
export type TaskTypeUpdate = Database['public']['Tables']['task_types']['Update'];

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

export interface TaskWithMeta extends Task {
  // Additional metadata fields if needed
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
  // Add other settings as needed
}