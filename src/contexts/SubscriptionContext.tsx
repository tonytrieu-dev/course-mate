import React, { createContext, useContext, ReactNode } from 'react';
import { features } from '../utils/buildConfig';
import { logger } from '../utils/logger';

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
  subscriptionStatus: 'active' | 'inactive' | 'canceled' | 'past_due' | null;
  
  // Usage tracking (for SaaS mode)
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  canUseFeature: (feature: string) => boolean;
  
  // Actions (no-op in personal mode)
  upgradeSubscription: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkUsage: () => Promise<void>;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

// Create context
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Default personal mode plan (unlimited)
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

// Provider component
export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  // In personal mode, everything is unlimited and free
  const value: SubscriptionContextType = {
    // Personal mode: always subscribed with unlimited plan
    currentPlan: features.isPersonalMode ? personalPlan : null,
    isSubscribed: features.isPersonalMode ? true : false,
    subscriptionStatus: features.isPersonalMode ? 'active' : null,
    
    // Usage tracking
    aiCreditsUsed: 0, // Not tracked in personal mode
    aiCreditsLimit: features.aiCreditLimit,
    
    // Personal mode: all features always available
    canUseFeature: (feature: string) => {
      if (features.isPersonalMode) {
        return true; // Everything is available in personal mode
      }
      
      // In SaaS mode, implement actual feature checking logic
      // This would check subscription plan and usage limits
      return false; // Placeholder for SaaS mode logic
    },
    
    // Actions (no-op in personal mode)
    upgradeSubscription: async (planId: string) => {
      if (features.isPersonalMode) {
        logger.info('Upgrade not needed in personal mode - all features are already unlimited');
        return;
      }
      
      // In SaaS mode, implement Stripe checkout
      throw new Error('Subscription upgrade not implemented in SaaS mode yet');
    },
    
    cancelSubscription: async () => {
      if (features.isPersonalMode) {
        logger.info('Cannot cancel personal mode - it\'s always active');
        return;
      }
      
      // In SaaS mode, implement subscription cancellation
      throw new Error('Subscription cancellation not implemented in SaaS mode yet');
    },
    
    checkUsage: async () => {
      if (features.isPersonalMode) {
        return; // No usage limits to check
      }
      
      // In SaaS mode, fetch current usage from backend
      console.log('Usage check not implemented for SaaS mode yet');
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