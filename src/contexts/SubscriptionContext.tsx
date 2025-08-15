import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { features } from '../utils/buildConfig';
import { logger } from '../utils/logger';
import { subscriptionService, SubscriptionStatus } from '../services/subscriptionService';
import { usageLimitService, UsageLimits } from '../services/usageLimitService';
import { supabase } from '../services/supabaseClient';

// Subscription types for TypeScript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual' | 'academic';
  interval: string;
  intervalCount?: number;
  savings?: number;
  features: string[];
}

interface SubscriptionContextType {
  // Subscription state
  currentPlan: SubscriptionPlan | null;
  availablePlans: SubscriptionPlan[];
  billingCycle: 'monthly' | 'annual' | 'academic';
  isSubscribed: boolean;
  subscriptionStatus: 'free' | 'trialing' | 'active' | 'canceled' | 'lifetime';
  trialDaysRemaining: number | null;
  loading: boolean;
  
  // Academic year info
  currentAcademicYear: {
    start: Date;
    end: Date;
    monthsRemaining: number;
  } | null;
  
  // Usage tracking (for SaaS mode)
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  chatbotQueriesUsed: number;
  chatbotQueriesLimit: number;
  canUseFeature: (feature: string) => boolean;
  useChatbotQuery: () => Promise<boolean>;
  
  // Actions
  startFreeTrial: (planType?: 'monthly' | 'annual' | 'academic') => Promise<void>;
  manageBilling: () => Promise<void>;
  switchBillingCycle: (newCycle: 'monthly' | 'annual' | 'academic') => Promise<void>;
  checkUsage: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  
  // Student-specific
  getUpgradeMessage: () => Promise<string>;
  getPlanByBillingCycle: (cycle: 'monthly' | 'annual' | 'academic') => SubscriptionPlan;
  
  // NEW: Enhanced usage tracking (SAFE - added without breaking existing functionality)
  usageLimits: UsageLimits | null;
  canUploadFile: () => Promise<{ allowed: boolean; reason?: string; upgradeMessage?: string }>;
  shouldShowUsageWarning: (featureType: 'ai' | 'files') => boolean;
  getUsagePercentage: (featureType: 'ai' | 'files') => number;
  refreshUsageLimits: () => Promise<void>;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

// Create context
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Academic year helper functions - Semester system only (10 months)
const getAcademicYear = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  
  // Semester system: August-May (10 months)
  if (month >= 8) {
    return { start: year, end: year + 1, system: 'semester' };
  } else {
    return { start: year - 1, end: year, system: 'semester' };
  }
};

const getAcademicYearDates = (academicYear = getAcademicYear()) => {
  return {
    start: new Date(academicYear.start, 7, 1), // August 1st
    end: new Date(academicYear.end, 4, 31), // May 31st
    months: 10,
    system: 'semester'
  };
};

const calculateMonthsRemaining = () => {
  const now = new Date();
  const academicYear = getAcademicYear(now);
  const { end, months } = getAcademicYearDates(academicYear);
  
  if (now > end) {
    return months; // Full academic year for next year
  }
  
  const monthsLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return Math.min(months, monthsLeft);
};

// Enhanced plan definitions with billing cycles
const personalPlan: SubscriptionPlan = {
  id: 'personal',
  name: 'Personal (Unlimited)',
  price: 0,
  billingCycle: 'monthly',
  interval: 'month',
  features: [
    'Unlimited AI queries',
    'Canvas integration', 
    'File management',
    'All productivity features',
    'No usage limits'
  ]
};

const studentProMonthly: SubscriptionPlan = {
  id: 'student-pro-monthly',
  name: 'ScheduleBud Pro - Monthly',
  price: 3.99,
  billingCycle: 'monthly',
  interval: 'month',
  features: [
    'Unlimited AI study assistance',
    'Advanced analytics & insights', 
    'Smart schedule optimization',
    'Export to multiple formats',
    'Bulk task operations'
  ]
};

const studentProAnnual: SubscriptionPlan = {
  id: 'student-pro-annual',
  name: 'ScheduleBud Pro - Annual',
  price: 24,
  billingCycle: 'annual', 
  interval: 'year',
  savings: 50, // 50% savings vs monthly
  features: [
    'Everything in Monthly plan',
    'Save 50% with annual billing',
    'Unlimited AI study assistance',
    'Advanced analytics & insights',
    'Smart schedule optimization', 
    'Export to multiple formats',
    'Bulk task operations'
  ]
};

const studentProAcademic: SubscriptionPlan = {
  id: 'student-pro-academic',
  name: 'ScheduleBud Pro - Academic Year',
  price: 24, // Updated to match annual pricing
  billingCycle: 'academic',
  interval: 'month',
  intervalCount: 10, // Default to semester system
  savings: 50, // 50% savings vs monthly equivalent  
  features: [
    'Pay for school year only (Aug-May)',
    'No summer charges',
    'Everything in Monthly plan',
    'Unlimited AI study assistance',
    'Advanced analytics & insights',
    'Smart schedule optimization',
    'Export to multiple formats',
    'Bulk task operations'
  ]
};

const freePlan: SubscriptionPlan = {
  id: 'free',
  name: 'Free Student Plan',
  price: 0,
  billingCycle: 'monthly',
  interval: 'month',
  features: [
    'Basic task management',
    'Canvas calendar sync',
    'Limited AI queries (3/day)',
    'Basic file storage (25 files)', 
    'Community support'
  ]
};

// Available plans array
const availablePlans = [studentProMonthly, studentProAnnual, studentProAcademic];

// Provider component
export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ status: 'free' });
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatbotQueriesUsed, setChatbotQueriesUsed] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'academic'>('monthly');
  const [currentAcademicYear, setCurrentAcademicYear] = useState<{
    start: Date;
    end: Date;
    monthsRemaining: number;
  } | null>(null);
  
  // NEW: Enhanced usage tracking state (SAFE - added without breaking existing functionality)
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);

  // Initialize academic year info
  useEffect(() => {
    const updateAcademicYear = () => {
      const dates = getAcademicYearDates(getAcademicYear(new Date()));
      const monthsRemaining = calculateMonthsRemaining();
      
      setCurrentAcademicYear({
        start: dates.start,
        end: dates.end,
        monthsRemaining
      });
    };

    updateAcademicYear();
    
    // Update daily (in case academic year changes)
    const interval = setInterval(updateAcademicYear, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // NEW: Initialize usage limits (SAFE - runs independently of existing functionality)
  useEffect(() => {
    const loadUsageLimits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const limits = await usageLimitService.getUsageSummary(
          user?.id, 
          subscriptionStatus.status
        );
        setUsageLimits(limits);
      } catch (error) {
        logger.error('Error loading usage limits, using safe defaults', { error });
        // Safe defaults that don't block functionality
        setUsageLimits({
          aiQueries: { used: 0, limit: 999, warningThreshold: 800 },
          fileStorage: { used: 0, limit: 999, warningThreshold: 800 },
          canvasIntegration: true,
          advancedAnalytics: true,
          exportFeatures: true
        });
      }
    };

    if (!loading) {
      loadUsageLimits();
    }
  }, [subscriptionStatus.status, loading]);

  // Load initial subscription status
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      try {
        const status = await subscriptionService.getSubscriptionStatus();
        setSubscriptionStatus(status);
        
        // Load billing cycle from user data if available
        // TODO: This would come from subscriptionService.getUserBillingCycle()
        // For now, default to monthly
        
        if (status.status === 'trialing') {
          const days = await subscriptionService.getTrialDaysRemaining();
          setTrialDaysRemaining(days);
        }
      } catch (error) {
        logger.error('Failed to load subscription status', { error });
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionStatus();
  }, []);

  // Subscribe to real-time status changes
  useEffect(() => {
    const unsubscribe = subscriptionService.subscribeToStatusChanges((newStatus) => {
      setSubscriptionStatus(newStatus);
      
      if (newStatus.status === 'trialing') {
        subscriptionService.getTrialDaysRemaining().then(setTrialDaysRemaining);
      } else {
        setTrialDaysRemaining(null);
      }
    });

    return unsubscribe;
  }, []);

  // Get current chatbot query limit based on subscription status
  const getCurrentChatbotLimit = (): number => {
    if (features.isPersonalMode) {
      return 999; // Unlimited for personal mode
    }

    // Free users: 3 queries per day  
    // Paid users: 50 queries per day
    const isSubscribed = subscriptionStatus.status === 'active' || subscriptionStatus.status === 'trialing';
    return isSubscribed ? 50 : 3;
  };

  // Load daily query usage from localStorage
  const loadQueryUsage = (): number => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`chatbot_queries_${today}`);
    return stored ? parseInt(stored, 10) : 0;
  };

  // Save daily query usage to localStorage
  const saveQueryUsage = (count: number): void => {
    const today = new Date().toDateString();
    localStorage.setItem(`chatbot_queries_${today}`, count.toString());
  };

  // Initialize query usage on component mount
  useEffect(() => {
    setChatbotQueriesUsed(loadQueryUsage());
  }, []);

  // Get current plan based on status and billing cycle
  const getCurrentPlan = (): SubscriptionPlan => {
    if (features.isPersonalMode) {
      return personalPlan;
    }

    switch (subscriptionStatus.status) {
      case 'trialing':
      case 'active':
        return getPlanByBillingCycle(billingCycle);
      case 'free':
      case 'canceled':
      default:
        return freePlan;
    }
  };

  // Helper function to get plan by billing cycle
  const getPlanByBillingCycle = (cycle: 'monthly' | 'annual' | 'academic'): SubscriptionPlan => {
    switch (cycle) {
      case 'monthly':
        return studentProMonthly;
      case 'annual':
        return studentProAnnual;
      case 'academic':
        return studentProAcademic;
      default:
        return studentProMonthly;
    }
  };

  // Check if user is subscribed (trialing or active)
  const isSubscribed = features.isPersonalMode || 
    subscriptionStatus.status === 'trialing' || 
    subscriptionStatus.status === 'active';

  const value: SubscriptionContextType = {
    // Subscription state
    currentPlan: getCurrentPlan(),
    isSubscribed,
    subscriptionStatus: subscriptionStatus.status,
    trialDaysRemaining,
    loading,
    
    // Usage tracking
    aiCreditsUsed: 0, // TODO: Implement usage tracking
    aiCreditsLimit: features.aiCreditLimit,
    chatbotQueriesUsed,
    chatbotQueriesLimit: getCurrentChatbotLimit(),
    
    // Feature access control
    canUseFeature: (feature: string) => {
      if (features.isPersonalMode) {
        return true; // Everything is available in personal mode
      }
      
      // Use subscription service for feature checking
      if (loading) {
        return false; // Deny access while loading
      }
      
      // Check chatbot query limits
      if (feature === 'chatbot' || feature === 'aiQueries') {
        return chatbotQueriesUsed < getCurrentChatbotLimit();
      }
      
      // Grade analytics feature - auto-enabled for paid users
      if (feature === 'grade_analytics' || feature === 'gradeAnalytics') {
        return isSubscribed || subscriptionStatus.status === 'trialing' || subscriptionStatus.status === 'active' || subscriptionStatus.status === 'lifetime';
      }
      
      // AI syllabus extraction feature - unlimited for paid users
      if (feature === 'ai_syllabus_extraction' || feature === 'aiSyllabusExtraction') {
        return isSubscribed || subscriptionStatus.status === 'trialing' || subscriptionStatus.status === 'active' || subscriptionStatus.status === 'lifetime';
      }
      
      // Allow basic features for free users
      const freeFeatures = [
        'basic_tasks',
        'basic_calendar',
        'canvas_integration',
        'limited_ai_queries',
        'basic_analytics',
      ];

      if (freeFeatures.includes(feature)) {
        return true;
      }

      // Student Plan features require subscription
      return isSubscribed;
    },
    
    // Actions
    startFreeTrial: async () => {
      if (features.isPersonalMode) {
        logger.info('Free trial not needed in personal mode');
        return;
      }

      try {
        const { url } = await subscriptionService.createCheckoutSession();
        window.location.href = url;
      } catch (error) {
        logger.error('Failed to start free trial', { error });
        throw error;
      }
    },
    
    manageBilling: async () => {
      if (features.isPersonalMode) {
        logger.info('Billing management not available in personal mode');
        return;
      }

      try {
        const { url } = await subscriptionService.createPortalSession();
        window.location.href = url;
      } catch (error) {
        logger.error('Failed to open billing portal', { error });
        throw error;
      }
    },
    
    checkUsage: async () => {
      if (features.isPersonalMode) {
        return; // No usage limits to check
      }
      
      // Refresh daily query count
      const currentUsage = loadQueryUsage();
      setChatbotQueriesUsed(currentUsage);
      logger.info('Usage refreshed', { chatbotQueriesUsed: currentUsage });
    },

    // Use a chatbot query (increments counter)
    useChatbotQuery: async () => {
      if (features.isPersonalMode) {
        return true; // Unlimited in personal mode
      }

      const currentLimit = getCurrentChatbotLimit();
      if (chatbotQueriesUsed >= currentLimit) {
        return false; // Query limit exceeded
      }

      // Increment usage counter
      const newCount = chatbotQueriesUsed + 1;
      setChatbotQueriesUsed(newCount);
      saveQueryUsage(newCount);
      
      logger.info('Chatbot query used', { 
        used: newCount, 
        limit: currentLimit, 
        remaining: currentLimit - newCount 
      });
      
      return true;
    },

    refreshStatus: async () => {
      try {
        setLoading(true);
        const status = await subscriptionService.getSubscriptionStatus();
        setSubscriptionStatus(status);
        
        if (status.status === 'trialing') {
          const days = await subscriptionService.getTrialDaysRemaining();
          setTrialDaysRemaining(days);
        } else {
          setTrialDaysRemaining(null);
        }
      } catch (error) {
        logger.error('Failed to refresh subscription status', { error });
      } finally {
        setLoading(false);
      }
    },

    getUpgradeMessage: async () => {
      return await subscriptionService.getUpgradeMessage();
    },
    
    // Missing properties
    availablePlans: [personalPlan, studentProMonthly, studentProAnnual, studentProAcademic],
    billingCycle: getCurrentPlan()?.billingCycle || 'monthly',
    currentAcademicYear: getCurrentPlan()?.billingCycle === 'academic' ? {
      start: new Date(),
      end: new Date(),
      monthsRemaining: calculateMonthsRemaining()
    } : null,
    switchBillingCycle: async (newCycle: 'monthly' | 'annual' | 'academic') => {
      // TODO: Implement billing cycle switching
      logger.info('Billing cycle switching not yet implemented', { newCycle });
    },
    getPlanByBillingCycle: (cycle: 'monthly' | 'annual' | 'academic') => {
      switch (cycle) {
        case 'monthly': return studentProMonthly;
        case 'annual': return studentProAnnual;
        case 'academic': return studentProAcademic; // Academic plan
        default: return studentProMonthly;
      }
    },
    
    // NEW: Enhanced usage tracking methods (SAFE - added without breaking existing functionality)
    usageLimits,
    
    canUploadFile: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        return await usageLimitService.canUploadFile(user?.id, subscriptionStatus.status);
      } catch (error) {
        logger.error('Error checking file upload permission, allowing access', { error });
        return { allowed: true }; // Fail open - allow access on error
      }
    },
    
    shouldShowUsageWarning: (featureType: 'ai' | 'files') => {
      try {
        if (!usageLimits) return false;
        
        if (featureType === 'ai') {
          const { used, limit, warningThreshold } = usageLimits.aiQueries;
          return usageLimitService.shouldShowUsageWarning(used, limit, warningThreshold);
        } else if (featureType === 'files') {
          const { used, limit, warningThreshold } = usageLimits.fileStorage;
          return usageLimitService.shouldShowUsageWarning(used, limit, warningThreshold);
        }
        
        return false;
      } catch (error) {
        logger.error('Error checking usage warning, hiding warning', { error });
        return false; // Fail safe - don't show warnings on error
      }
    },
    
    getUsagePercentage: (featureType: 'ai' | 'files') => {
      try {
        if (!usageLimits) return 0;
        
        if (featureType === 'ai') {
          const { used, limit } = usageLimits.aiQueries;
          return limit > 0 ? Math.round((used / limit) * 100) : 0;
        } else if (featureType === 'files') {
          const { used, limit } = usageLimits.fileStorage;
          return limit > 0 ? Math.round((used / limit) * 100) : 0;
        }
        
        return 0;
      } catch (error) {
        logger.error('Error calculating usage percentage, returning 0', { error });
        return 0; // Fail safe - return 0% on error
      }
    },
    
    refreshUsageLimits: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const limits = await usageLimitService.getUsageSummary(
          user?.id, 
          subscriptionStatus.status
        );
        setUsageLimits(limits);
      } catch (error) {
        logger.error('Error refreshing usage limits, keeping current state', { error });
        // Don't update state on error to avoid breaking UI
      }
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook to use subscription context
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
};

// Export types for use in other components
export type { SubscriptionPlan, SubscriptionContextType };