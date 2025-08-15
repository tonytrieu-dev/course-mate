/**
 * Usage Limit Service - Feature Gate Implementation
 * 
 * CRITICAL: This service is designed to NEVER break existing functionality.
 * All methods fail open (return true/allow access) if there are any errors.
 * This ensures production stability while adding premium feature gates.
 */

import { supabase } from './supabaseClient';
import { features } from '../utils/buildConfig';
import { logger } from '../utils/logger';

export interface UsageLimits {
  aiQueries: { used: number; limit: number; warningThreshold: number };
  fileStorage: { used: number; limit: number; warningThreshold: number };
  canvasIntegration: boolean;
  advancedAnalytics: boolean;
  exportFeatures: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeMessage?: string;
  usageInfo?: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export const usageLimitService = {
  /**
   * SAFETY FIRST: Get current file count for user
   * Returns 0 on error to avoid blocking functionality
   */
  async getFileCount(userId?: string): Promise<number> {
    try {
      if (features.isPersonalMode) {
        return 0; // Unlimited in personal mode
      }

      if (!userId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          logger.warn('Could not get user for file count, allowing access', { error: userError });
          return 0; // Fail open - allow access if can't determine user
        }
        userId = user.id;
      }

      // Count files from class_files table
      const { count, error } = await supabase
        .from('class_files')
        .select('*', { count: 'exact', head: true })
        .eq('owner', userId);

      if (error) {
        logger.warn('Error getting file count, allowing access', { error, userId });
        return 0; // Fail open - allow access on database error
      }

      return count || 0;
    } catch (error) {
      logger.error('Exception getting file count, allowing access', { error, userId });
      return 0; // Fail open - allow access on any exception
    }
  },

  /**
   * SAFETY FIRST: Check if user can upload files
   * Returns allowed: true on any error to avoid breaking uploads
   */
  async canUploadFile(userId?: string, subscriptionStatus?: string): Promise<UsageCheckResult> {
    try {
      if (features.isPersonalMode) {
        return { allowed: true }; // Always allow in personal mode
      }

      // If subscription status indicates paid user, allow unlimited
      if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
        return { allowed: true };
      }

      const fileCount = await this.getFileCount(userId);
      const limit = 25; // Free users get 25 files
      const warningThreshold = Math.floor(limit * 0.8); // 20 files

      if (fileCount >= limit) {
        return {
          allowed: false,
          reason: 'file_storage_limit',
          upgradeMessage: `You've reached the file storage limit (${limit} files). Upgrade to Student Plan for unlimited file storage.`,
          usageInfo: {
            used: fileCount,
            limit,
            percentage: Math.round((fileCount / limit) * 100)
          }
        };
      }

      return {
        allowed: true,
        usageInfo: {
          used: fileCount,
          limit,
          percentage: Math.round((fileCount / limit) * 100)
        }
      };
    } catch (error) {
      logger.error('Exception checking file upload permission, allowing access', { error });
      return { allowed: true }; // Fail open - allow access on any exception
    }
  },

  /**
   * SAFETY FIRST: Get comprehensive usage summary
   * Returns safe defaults on any error to avoid UI breaks
   */
  async getUsageSummary(userId?: string, subscriptionStatus?: string): Promise<UsageLimits> {
    try {
      if (features.isPersonalMode) {
        return {
          aiQueries: { used: 0, limit: -1, warningThreshold: -1 }, // Unlimited
          fileStorage: { used: 0, limit: -1, warningThreshold: -1 }, // Unlimited
          canvasIntegration: true,
          advancedAnalytics: true,
          exportFeatures: true
        };
      }

      const isPaidUser = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
      
      // Get AI query usage from localStorage (existing functionality)
      const today = new Date().toDateString();
      const aiQueriesUsed = parseInt(localStorage.getItem(`chatbot_queries_${today}`) || '0', 10);
      const aiLimit = isPaidUser ? 50 : 3;

      // Get file storage usage
      const fileCount = await this.getFileCount(userId);
      const fileLimit = isPaidUser ? -1 : 25; // -1 means unlimited

      return {
        aiQueries: { 
          used: aiQueriesUsed, 
          limit: aiLimit,
          warningThreshold: Math.floor(aiLimit * 0.8) 
        },
        fileStorage: { 
          used: fileCount, 
          limit: fileLimit,
          warningThreshold: fileLimit > 0 ? Math.floor(fileLimit * 0.8) : -1 
        },
        canvasIntegration: isPaidUser, // Advanced Canvas features for paid users
        advancedAnalytics: isPaidUser, // Advanced analytics for paid users  
        exportFeatures: isPaidUser // Advanced export features for paid users
      };
    } catch (error) {
      logger.error('Exception getting usage summary, returning safe defaults', { error });
      // Return safe defaults that don't block functionality
      return {
        aiQueries: { used: 0, limit: 999, warningThreshold: 800 },
        fileStorage: { used: 0, limit: 999, warningThreshold: 800 },
        canvasIntegration: true,
        advancedAnalytics: true,
        exportFeatures: true
      };
    }
  },

  /**
   * SAFETY FIRST: Check if user should see usage warnings
   * Returns false on error to avoid unwanted warning popups
   */
  shouldShowUsageWarning(used: number, limit: number, warningThreshold: number): boolean {
    try {
      if (limit === -1) return false; // Unlimited, no warnings
      if (warningThreshold === -1) return false; // No threshold set
      
      return used >= warningThreshold && used < limit;
    } catch (error) {
      logger.error('Exception checking usage warning, hiding warning', { error });
      return false; // Fail safe - don't show warnings on error
    }
  },

  /**
   * SAFETY FIRST: Get user-friendly upgrade message for specific features
   * Returns generic message on error to avoid UI breaks
   */
  getUpgradeMessageForFeature(feature: string, usageInfo?: { used: number; limit: number }): string {
    try {
      const messages: Record<string, string> = {
        file_storage_limit: `You've reached the file storage limit${usageInfo ? ` (${usageInfo.used}/${usageInfo.limit} files)` : ''}. Upgrade to Student Plan for unlimited file storage and advanced features.`,
        ai_query_limit: `You've reached the daily AI query limit${usageInfo ? ` (${usageInfo.used}/${usageInfo.limit} queries)` : ''}. Upgrade for unlimited AI assistance.`,
        canvas_integration: 'Advanced Canvas features are available with Student Plan. Upgrade for enhanced Canvas integration.',
        advanced_analytics: 'Advanced study analytics and GPA tracking are available with Student Plan.',
        export_features: 'Advanced export options (PDF, calendar) are available with Student Plan.'
      };

      return messages[feature] || 'This premium feature is available with Student Plan. Upgrade to unlock unlimited access.';
    } catch (error) {
      logger.error('Exception getting upgrade message, returning default', { error });
      return 'Upgrade to Student Plan for unlimited access to all features.';
    }
  }
};