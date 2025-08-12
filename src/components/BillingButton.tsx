import React, { useState, useCallback } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import Button from "./ui/Button";
import { logger } from "../utils/logger";

interface BillingButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
}

const BillingButton: React.FC<BillingButtonProps> = ({
  variant = 'outline',
  size = 'md',
  className = '',
  showIcon = true,
  fullWidth = false
}) => {
  const { 
    subscriptionStatus, 
    currentPlan, 
    trialDaysRemaining, 
    manageBilling, 
    loading 
  } = useSubscription();
  
  const [isOpening, setIsOpening] = useState(false);

  // Handle billing portal access
  const handleManageBilling = useCallback(async () => {
    setIsOpening(true);
    try {
      await manageBilling();
      // Will redirect to Stripe Customer Portal
    } catch (error) {
      logger.error('Failed to open billing portal', { error });
      setIsOpening(false);
      // Could show error toast here in the future
    }
  }, [manageBilling]);

  // Get button text based on subscription status
  const getButtonText = () => {
    if (isOpening) return "Opening...";
    
    switch (subscriptionStatus) {
      case 'trialing':
        const daysText = trialDaysRemaining === 1 ? 'day' : 'days';
        return trialDaysRemaining 
          ? `Trial: ${trialDaysRemaining} ${daysText} left`
          : 'Manage Trial';
      case 'active':
        return 'Manage Billing';
      case 'canceled':
        return 'Reactivate Plan';
      default:
        return 'Manage Account';
    }
  };

  // Get button styling based on subscription status
  const getButtonVariant = () => {
    if (subscriptionStatus === 'trialing' && trialDaysRemaining && trialDaysRemaining <= 2) {
      return 'primary'; // Urgent styling for trial ending soon
    }
    return variant;
  };

  // Don't show for free users (they should see upgrade modal instead)
  if (subscriptionStatus === 'free') {
    return null;
  }

  const buttonText = getButtonText();
  const buttonVariant = getButtonVariant();

  // Use custom button for more flexibility with icons
  const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:focus:ring-0';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-gray-800 hover:bg-gray-900 focus:bg-gray-900 active:bg-gray-950 text-white shadow-sm hover:shadow-md',
    outline: 'border-2 border-gray-300 hover:border-gray-400 focus:border-blue-500 text-gray-700 bg-white hover:bg-gray-50 focus:bg-blue-50',
    ghost: 'text-gray-600 hover:text-gray-900 focus:text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-2 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-lg'
  };

  const classes = `${baseStyles} ${variantStyles[buttonVariant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${showIcon ? 'flex items-center justify-center gap-2' : ''} ${className}`;

  return (
    <button
      onClick={handleManageBilling}
      disabled={isOpening || loading}
      className={classes}
      aria-label={`${buttonText} - Opens Stripe Customer Portal in new tab`}
      data-testid="billing-button"
    >
      {showIcon && !isOpening && (
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {subscriptionStatus === 'trialing' ? (
            // Clock icon for trial
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          ) : (
            // Credit card icon for active subscription
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
            />
          )}
        </svg>
      )}
      
      {isOpening && (
        <svg 
          className="animate-spin w-4 h-4" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      <span>{buttonText}</span>
    </button>
  );
};

// Convenience component for settings/profile areas
export const BillingSection: React.FC = () => {
  const { subscriptionStatus, currentPlan, trialDaysRemaining } = useSubscription();

  // Don't show section for free users
  if (subscriptionStatus === 'free') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            Current Plan
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {currentPlan?.name || 'ScheduleBud - Student Plan'}
          </p>
        </div>
        
        {subscriptionStatus === 'trialing' && trialDaysRemaining && (
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
            {trialDaysRemaining} days left
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <BillingButton 
          variant="outline" 
          size="sm" 
          fullWidth={true}
          className="sm:flex-1"
        />
        
        {subscriptionStatus === 'trialing' && (
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
              ${currentPlan?.price || 3.99}/month after trial
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingButton;