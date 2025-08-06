import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { features } from '../utils/buildConfig';
import { logger } from '../utils/logger';
import { subscriptionService, SubscriptionStatus } from '../services/subscriptionService';

// Subscription types for TypeScript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface SubscriptionContextType {
  // Subscription state
  currentPlan: SubscriptionPlan | null;
  isSubscribed: boolean;
  subscriptionStatus: 'free' | 'trialing' | 'active' | 'canceled';
  trialDaysRemaining: number | null;
  loading: boolean;
  
  // Usage tracking (for SaaS mode)
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  canUseFeature: (feature: string) => boolean;
  
  // Actions
  startFreeTrial: () => Promise<void>;
  manageBilling: () => Promise<void>;
  checkUsage: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  
  // Student-specific
  getUpgradeMessage: () => Promise<string>;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

// Create context
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Plans
const personalPlan: SubscriptionPlan = {
  id: 'personal',
  name: 'Personal (Unlimited)',
  price: 0,
  features: [
    'Unlimited AI queries',
    'Canvas integration',
    'File management',
    'All productivity features',
    'No usage limits'
  ]
};

const studentProPlan: SubscriptionPlan = {
  id: 'student-pro',
  name: 'ScheduleBud - Student Plan',
  price: 5,
  features: [
    'Unlimited AI study assistance',
    'Advanced analytics & insights',
    'Smart schedule optimization',
    'Premium Canvas features',
    'Priority support during finals',
    'Export to multiple formats',
    'Bulk task operations'
  ]
};

const freePlan: SubscriptionPlan = {
  id: 'free',
  name: 'Free Student Plan',
  price: 0,
  features: [
    'Basic task management',
    'Canvas integration',
    'Limited AI queries (5/day)',
    'Basic analytics',
    'Community support'
  ]
};

// Provider component
export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ status: 'free' });
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial subscription status
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      try {
        const status = await subscriptionService.getSubscriptionStatus();
        setSubscriptionStatus(status);
        
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

  // Get current plan based on status
  const getCurrentPlan = (): SubscriptionPlan => {
    if (features.isPersonalMode) {
      return personalPlan;
    }

    switch (subscriptionStatus.status) {
      case 'trialing':
      case 'active':
        return studentProPlan;
      case 'free':
      case 'canceled':
      default:
        return freePlan;
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
    
    // Feature access control
    canUseFeature: (feature: string) => {
      if (features.isPersonalMode) {
        return true; // Everything is available in personal mode
      }
      
      // Use subscription service for feature checking
      if (loading) {
        return false; // Deny access while loading
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
      
      // TODO: Implement usage checking
      logger.info('Usage check not yet implemented');
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