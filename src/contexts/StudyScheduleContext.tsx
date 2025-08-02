import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  StudySchedule,
  StudyProfile,
  WorkloadAnalysis,
  StudyScheduleFeatureLimits
} from '../types/studySchedule';
import type { ClassWithRelations } from '../types/database';
import { useStudySchedule } from '../hooks/useStudySchedule';
import { getBuildMode } from '../utils/buildConfig';
import { logger } from '../utils/logger';

interface StudyScheduleContextType {
  // Core data
  currentSchedule: StudySchedule | null;
  workloadAnalysis: WorkloadAnalysis | null;
  studyProfile: StudyProfile | null;
  
  // Feature limits
  featureLimits: StudyScheduleFeatureLimits;
  isPremium: boolean;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadWorkloadAnalysis: () => Promise<void>;
  generateSchedule: (request: any) => Promise<void>;
  updateStudyProfile: (profile: StudyProfile) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: any, feedback?: any) => Promise<void>;
  refreshFromCanvasTasks: () => Promise<void>;
  
  // Premium actions
  upgradePrompt: () => void;
  checkFeatureAccess: (feature: keyof StudyScheduleFeatureLimits) => boolean;
}

const StudyScheduleContext = createContext<StudyScheduleContextType | undefined>(undefined);

interface StudyScheduleProviderProps {
  children: React.ReactNode;
  user: User | null;
  classes: ClassWithRelations[];
  useSupabase?: boolean;
}

export const StudyScheduleProvider: React.FC<StudyScheduleProviderProps> = ({
  children,
  user,
  classes,
  useSupabase = false
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Use the study schedule hook
  const studyScheduleHook = useStudySchedule({
    user,
    classes,
    useSupabase
  });
  
  // Determine premium status based on build mode and subscription
  useEffect(() => {
    const checkPremiumStatus = () => {
      // In personal mode, all features are available
      if (getBuildMode() === 'personal') {
        setIsPremium(true);
        return;
      }
      
      // In SaaS mode, check actual subscription status
      // For now, we'll use a simple localStorage check
      // In a real app, this would check with the subscription service
      const hasActiveSubscription = localStorage.getItem('premium_subscription') === 'true';
      setIsPremium(hasActiveSubscription);
      
      logger.debug('[StudyScheduleContext] Premium status checked', {
        mode: getBuildMode(),
        hasSubscription: hasActiveSubscription,
        isPremium: hasActiveSubscription
      });
    };
    
    checkPremiumStatus();
    
    // Listen for subscription changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'premium_subscription') {
        checkPremiumStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Feature limits based on premium status
  const featureLimits: StudyScheduleFeatureLimits = {
    max_sessions_per_week: isPremium ? 50 : 10,
    max_classes_analyzed: isPremium ? 20 : 3,
    ai_recommendations_enabled: isPremium,
    retention_analytics_enabled: isPremium,
    advanced_optimization_enabled: isPremium,
    export_formats: isPremium ? ['pdf', 'ical', 'csv'] : ['csv']
  };
  
  // Check if user has access to a specific feature
  const checkFeatureAccess = (feature: keyof StudyScheduleFeatureLimits): boolean => {
    const limit = featureLimits[feature];
    
    // Handle boolean features
    if (typeof limit === 'boolean') {
      return limit;
    }
    
    // Handle array features
    if (Array.isArray(limit)) {
      return limit.length > 0;
    }
    
    // Handle numeric features (assume any positive number means access)
    if (typeof limit === 'number') {
      return limit > 0;
    }
    
    return false;
  };
  
  // Show upgrade prompt
  const upgradePrompt = () => {
    if (getBuildMode() === 'personal') {
      // In personal mode, all features are already available
      logger.debug('[StudyScheduleContext] Upgrade prompt called in personal mode - ignoring');
      return;
    }
    
    setShowUpgradePrompt(true);
    
    // In a real app, this would show a proper upgrade modal or redirect to billing
    setTimeout(() => {
      const shouldUpgrade = window.confirm(
        'This feature requires a premium subscription. Would you like to upgrade now?\n\n' +
        'Premium features include:\n' +
        '• AI-powered optimization\n' +
        '• Unlimited classes\n' +
        '• Advanced analytics\n' +
        '• Export options\n\n' +
        'Click OK to simulate upgrade (for demo purposes)'
      );
      
      if (shouldUpgrade) {
        // Simulate upgrade for demo purposes
        localStorage.setItem('premium_subscription', 'true');
        setIsPremium(true);
        logger.debug('[StudyScheduleContext] Simulated premium upgrade for demo');
      }
      
      setShowUpgradePrompt(false);
    }, 100);
  };
  
  // Wrap study schedule actions with premium checks
  const generateScheduleWithLimits = async (request: any) => {
    // Check if advanced optimization goals require premium
    const advancedGoals = ['maximize_retention', 'focus_difficult'];
    const hasAdvancedGoals = request.optimization_goals?.some((goal: string) => 
      advancedGoals.includes(goal)
    );
    
    if (hasAdvancedGoals && !isPremium) {
      upgradePrompt();
      return;
    }
    
    // Check class limits
    const classCount = request.include_classes?.length || classes.length;
    if (classCount > featureLimits.max_classes_analyzed) {
      upgradePrompt();
      return;
    }
    
    return studyScheduleHook.generateSchedule(request);
  };
  
  const value: StudyScheduleContextType = {
    // Core data
    currentSchedule: studyScheduleHook.currentSchedule,
    workloadAnalysis: studyScheduleHook.workloadAnalysis,
    studyProfile: studyScheduleHook.studyProfile,
    
    // Feature limits
    featureLimits,
    isPremium,
    
    // State
    isLoading: studyScheduleHook.isLoading,
    error: studyScheduleHook.error,
    
    // Actions
    loadWorkloadAnalysis: studyScheduleHook.loadWorkloadAnalysis,
    generateSchedule: generateScheduleWithLimits,
    updateStudyProfile: studyScheduleHook.updateStudyProfile,
    updateSessionStatus: studyScheduleHook.updateSessionStatus,
    refreshFromCanvasTasks: studyScheduleHook.refreshFromCanvasTasks,
    
    // Premium actions
    upgradePrompt,
    checkFeatureAccess
  };
  
  return (
    <StudyScheduleContext.Provider value={value}>
      {children}
    </StudyScheduleContext.Provider>
  );
};

export const useStudyScheduleContext = (): StudyScheduleContextType => {
  const context = useContext(StudyScheduleContext);
  if (context === undefined) {
    throw new Error('useStudyScheduleContext must be used within a StudyScheduleProvider');
  }
  return context;
};

export default StudyScheduleContext;