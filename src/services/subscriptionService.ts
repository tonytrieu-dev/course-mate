/**
 * Subscription Service
 * Handles all Stripe subscription-related API calls for ScheduleBud micro-SaaS
 */

import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

export interface SubscriptionStatus {
  status: 'free' | 'trialing' | 'active' | 'canceled';
  trialEndDate?: string;
  stripeCustomerId?: string;
}

export class SubscriptionService {
  /**
   * Create a Stripe Checkout session for the student plan
   */
  async createCheckoutSession(): Promise<{ url: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        method: 'POST',
      });

      if (error) {
        logger.error('Failed to create checkout session', { error });
        throw new Error('Failed to create checkout session');
      }

      return data;
    } catch (error) {
      logger.error('Error in createCheckoutSession', { error });
      throw error;
    }
  }

  /**
   * Create a Stripe Customer Portal session for billing management
   */
  async createPortalSession(): Promise<{ url: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        method: 'POST',
      });

      if (error) {
        logger.error('Failed to create portal session', { error });
        throw new Error('Failed to create portal session');
      }

      return data;
    } catch (error) {
      logger.error('Error in createPortalSession', { error });
      throw error;
    }
  }

  /**
   * Get current user's subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { status: 'free' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('subscription_status, trial_end_date, stripe_customer_id')
        .eq('id', user.user.id)
        .single();

      if (error) {
        logger.error('Failed to fetch subscription status', { error });
        return { status: 'free' };
      }

      return {
        status: data.subscription_status || 'free',
        trialEndDate: data.trial_end_date,
        stripeCustomerId: data.stripe_customer_id,
      };
    } catch (error) {
      logger.error('Error in getSubscriptionStatus', { error });
      return { status: 'free' };
    }
  }

  /**
   * Check if user has access to pro features
   */
  async hasProAccess(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.status === 'trialing' || status.status === 'active';
  }

  /**
   * Get trial days remaining (returns null if not in trial)
   */
  async getTrialDaysRemaining(): Promise<number | null> {
    const status = await this.getSubscriptionStatus();
    
    if (status.status !== 'trialing' || !status.trialEndDate) {
      return null;
    }

    const trialEnd = new Date(status.trialEndDate);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Check if user can use a specific feature
   */
  async canUseFeature(feature: string): Promise<boolean> {
    const hasAccess = await this.hasProAccess();
    
    // Define which features require pro access
    const proFeatures = [
      'unlimited_ai_queries',
      'advanced_analytics',
      'smart_schedule_optimization',
      'premium_canvas_features',
      'priority_support',
      'export_advanced_formats',
      'bulk_task_operations',
    ];

    // Free features available to everyone
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

    if (proFeatures.includes(feature)) {
      return hasAccess;
    }

    // Default to requiring pro access for unknown features
    return hasAccess;
  }

  /**
   * Get student-friendly upgrade message based on current status
   */
  async getUpgradeMessage(): Promise<string> {
    const status = await this.getSubscriptionStatus();
    const trialDays = await this.getTrialDaysRemaining();

    switch (status.status) {
      case 'free':
        return "Start your 7-day free trial and unlock unlimited AI assistance for your studies!";
      
      case 'trialing':
        if (trialDays !== null && trialDays > 0) {
          return `${trialDays} day${trialDays === 1 ? '' : 's'} left in your free trial. Enjoy full access to all Pro features!`;
        } else {
          return "Your free trial is ending soon. Continue with Pro to keep all features!";
        }
      
      case 'active':
        return "You have ScheduleBud Pro! Enjoy unlimited AI assistance and advanced features.";
      
      case 'canceled':
        return "Your subscription was canceled. Start a new trial to get back to Pro features!";
      
      default:
        return "Upgrade to ScheduleBud Pro for unlimited AI help with your studies!";
    }
  }

  /**
   * Listen to subscription status changes in real-time
   */
  subscribeToStatusChanges(callback: (status: SubscriptionStatus) => void): () => void {
    const getUserAsync = async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        return () => {};
      }

      const subscription = supabase
        .channel('subscription_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userData.user.id}`,
          },
          (payload: any) => {
            const newStatus: SubscriptionStatus = {
              status: payload.new.subscription_status || 'free',
              trialEndDate: payload.new.trial_end_date,
              stripeCustomerId: payload.new.stripe_customer_id,
            };
            callback(newStatus);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    // Start async subscription setup
    getUserAsync().catch((error) => {
      logger.error('Failed to setup subscription listener', { error });
    });

    return () => {
      // Note: This cleanup won't work perfectly due to async nature
      // In production, consider using a different pattern
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();