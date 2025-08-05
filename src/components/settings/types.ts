import type { User } from '@supabase/supabase-js';
import type { ClassWithRelations } from '../../types/database';

export type SettingsTab = 'general' | 'canvas' | 'notifications' | 'study-schedule' | 'export-import';

export interface GeneralSettingsState {
  fontSize: string;
  defaultView: string;
  taskCompletionSound: boolean;
  showWeekNumbers: boolean;
  showNavigationBar: boolean;
  theme: 'light' | 'dark' | 'auto';
  academicSystem: 'semester' | 'quarter';
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SettingsModalProps {
  onClose: () => void;
  initialTab?: SettingsTab;
  user?: User | null;
  classes?: ClassWithRelations[];
  useSupabase?: boolean;
  isNavCollapsed?: boolean;
  setIsNavCollapsed?: (collapsed: boolean) => void;
}

export interface SettingsTabInfo {
  id: SettingsTab;
  label: string;
  icon: string;
  description: string;
}

export interface SettingsTabNavigationProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export interface GeneralSettingsTabProps {
  isNavCollapsed?: boolean;
  setIsNavCollapsed?: (collapsed: boolean) => void;
}

export interface StudyScheduleSettingsTabProps {
  onOpenOptimizer: () => void;
  user: User | null;
  classes: ClassWithRelations[];
}