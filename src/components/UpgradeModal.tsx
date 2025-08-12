import React, { useRef, useEffect, useCallback, KeyboardEvent, useState } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import Button from "./ui/Button";
import { logger } from "../utils/logger";

interface UpgradeModalProps {
  showModal: boolean;
  onClose: () => void;
  trigger?: 'feature_limit' | 'ai_limit' | 'manual' | 'trial_ending';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  showModal,
  onClose,
  trigger = 'manual'
}) => {
  const { 
    currentPlan, 
    subscriptionStatus, 
    trialDaysRemaining, 
    startFreeTrial, 
    loading 
  } = useSubscription();
  
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (showModal && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [showModal]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle trial start
  const handleStartTrial = useCallback(async () => {
    setIsStartingTrial(true);
    try {
      await startFreeTrial();
      // Modal will close automatically when redirected to Stripe
    } catch (error) {
      logger.error('Failed to start trial', { error, trigger });
      setIsStartingTrial(false);
      // Keep modal open to show error or retry
    }
  }, [startFreeTrial, trigger]);

  // Get trigger-specific messaging
  const getTriggerMessage = () => {
    switch (trigger) {
      case 'ai_limit':
        return {
          title: "AI Query Limit Reached",
          subtitle: "You've used all 5 daily AI queries on the free plan",
          highlight: "Unlimited AI assistance"
        };
      case 'feature_limit':
        return {
          title: "Premium Feature Required",
          subtitle: "This feature is available with ScheduleBud - Student Plan",
          highlight: "Advanced productivity tools"
        };
      case 'trial_ending':
        return {
          title: `Trial Ending${trialDaysRemaining ? ` in ${trialDaysRemaining} days` : ''}`,
          subtitle: "Continue with unlimited access to all premium features",
          highlight: "Keep all your progress"
        };
      default:
        return {
          title: "Upgrade to ScheduleBud - Student Plan",
          subtitle: "Unlock your full academic potential",
          highlight: "Everything students need"
        };
    }
  };

  const { title, subtitle, highlight } = getTriggerMessage();

  // Show current plan info for subscribed users
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
    return null; // Don't show upgrade modal to subscribed users
  }

  if (!showModal) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start sm:items-center z-[9999] p-1 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      aria-describedby="upgrade-modal-description"
      data-testid="upgrade-modal-backdrop"
    >
      <div 
        className="bg-white dark:bg-slate-800/95 backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-t-lg sm:rounded-lg w-full max-w-md sm:max-w-lg max-h-[100vh] sm:max-h-[95vh] overflow-y-auto mt-auto sm:mt-0 shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h2 
            id="upgrade-modal-title"
            className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          
          <p 
            id="upgrade-modal-description"
            className="text-sm sm:text-base text-gray-600 dark:text-slate-400"
          >
            {subtitle}
          </p>
        </div>

        {/* Student Plan Benefits */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              ScheduleBud - Student Plan
            </h3>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
              7-Day Free Trial
            </div>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              $3.99<span className="text-lg font-normal text-gray-600 dark:text-slate-400">/month</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Student-friendly pricing • Cancel anytime
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-2">
            {[
              'Unlimited AI study assistance',
              'Advanced schedule optimization',
              'Premium Canvas integration',
              'Detailed analytics & insights',
              'Priority support during finals',
              'Export to multiple formats',
              'Bulk task operations'
            ].map((feature, index) => (
              <div key={index} className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Student-focused messaging */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                {highlight}
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {trigger === 'trial_ending' 
                  ? 'Your trial gives you full access to see if ScheduleBud - Student Plan fits your study routine.'
                  : 'Try ScheduleBud - Student Plan free for 7 days. Perfect for busy students who need to stay organized.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            text={isStartingTrial ? "Starting Trial..." : "Start 7-Day Free Trial"}
            onClick={handleStartTrial}
            variant="primary"
            size="md"
            disabled={isStartingTrial || loading}
            className="flex-1 min-h-[44px] font-semibold"
            ariaLabel="Start 7-day free trial of ScheduleBud - Student Plan"
            dataTestId="start-trial-button"
          />
          
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="sm:w-32 min-h-[44px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:text-gray-900 focus:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 px-6 py-2 text-base rounded-lg"
            aria-label="Close upgrade modal"
            data-testid="close-upgrade-modal"
          >
            Maybe Later
          </button>
        </div>

        {/* Fine print */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-500">
            No credit card required for trial • $3.99/month after trial • Cancel anytime
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
            Built for students, by a student who understand your budget
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;