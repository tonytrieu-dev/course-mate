import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config';

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          completed: boolean;
          class?: string;
          type?: string;
          date?: string;
          isDuration?: boolean;
          dueDate?: string;
          dueTime?: string;
          startDate?: string;
          startTime?: string;
          endDate?: string;
          endTime?: string;
          priority?: 'low' | 'medium' | 'high';
          canvas_uid?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          completed?: boolean;
          class?: string;
          type?: string;
          date?: string;
          isDuration?: boolean;
          dueDate?: string;
          dueTime?: string;
          startDate?: string;
          startTime?: string;
          endDate?: string;
          endTime?: string;
          priority?: 'low' | 'medium' | 'high';
          canvas_uid?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          completed?: boolean;
          class?: string;
          type?: string;
          date?: string;
          isDuration?: boolean;
          dueDate?: string;
          dueTime?: string;
          startDate?: string;
          startTime?: string;
          endDate?: string;
          endTime?: string;
          priority?: 'low' | 'medium' | 'high';
          canvas_uid?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          istaskclass?: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          istaskclass?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          istaskclass?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_types: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color?: string;
          completed_color?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          completed_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          completed_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      class_files: {
        Row: {
          id: string;
          class_id: string;
          owner: string;
          name: string;
          path: string;
          size?: number;
          type?: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          owner: string;
          name: string;
          path: string;
          size?: number;
          type?: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          owner?: string;
          name?: string;
          path?: string;
          size?: number;
          type?: string;
          uploaded_at?: string;
        };
      };
      class_syllabi: {
        Row: {
          id: string;
          class_id: string;
          owner: string;
          name: string;
          path: string;
          size?: number;
          type?: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          owner: string;
          name: string;
          path: string;
          size?: number;
          type?: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          owner?: string;
          name?: string;
          path?: string;
          size?: number;
          type?: string;
          uploaded_at?: string;
        };
      };
      notification_settings: {
        Row: {
          id: number;
          user_id: string;
          email_enabled: boolean;
          notification_times: string[];
          active_hours_start: number;
          active_hours_end: number;
          email_address?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          email_enabled?: boolean;
          notification_times?: string[];
          active_hours_start?: number;
          active_hours_end?: number;
          email_address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          email_enabled?: boolean;
          notification_times?: string[];
          active_hours_start?: number;
          active_hours_end?: number;
          email_address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_notifications: {
        Row: {
          id: number;
          user_id: string;
          task_id: string;
          email_type: 'assignment_reminder' | 'new_assignment' | 'urgent_deadline';
          sent_at: string;
          opened_at?: string;
          clicked_at?: string;
          email_address: string;
          subject: string;
          message_id?: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          task_id: string;
          email_type: 'assignment_reminder' | 'new_assignment' | 'urgent_deadline';
          sent_at?: string;
          opened_at?: string;
          clicked_at?: string;
          email_address: string;
          subject: string;
          message_id?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          task_id?: string;
          email_type?: 'assignment_reminder' | 'new_assignment' | 'urgent_deadline';
          sent_at?: string;
          opened_at?: string;
          clicked_at?: string;
          email_address?: string;
          subject?: string;
          message_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type SupabaseClientType = SupabaseClient<Database>;

export const supabase: SupabaseClientType = createClient<Database>(
  supabaseConfig.url!,
  supabaseConfig.key!
);