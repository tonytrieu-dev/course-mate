import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

const SubscriptionSettingsTab: React.FC = () => {
  const { user } = useAuth();
  const { subscriptionStatus, currentPlan, trialDaysRemaining } = useSubscription();

  // Don't show this tab if user is already subscribed
  const shouldShowUpgrade = subscriptionStatus === 'free' || subscriptionStatus === 'trialing';

  const handleUpgradeClick = (url: string, planName: string) => {
    // TODO: Uncomment for payment analytics
    // Track the upgrade click for analytics
    // if (window.gtag) {
    //   window.gtag('event', 'upgrade_clicked', {
    //     plan: planName,
    //     source: 'settings'
    //   });
    // }
    
    // Open Stripe payment link in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getTrialStatusMessage = () => {
    if (subscriptionStatus === 'trialing' && trialDaysRemaining) {
      const daysText = trialDaysRemaining === 1 ? 'day' : 'days';
      return `You have ${trialDaysRemaining} ${daysText} left in your free trial`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Current Plan
        </h3>
        
        {subscriptionStatus === 'free' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 dark:text-slate-300">Free Plan</span>
          </div>
        )}
        
        {subscriptionStatus === 'trialing' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Free Trial Active
            </span>
          </div>
        )}
        
        {subscriptionStatus === 'active' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {currentPlan?.name || 'Student Plan'} Active
            </span>
          </div>
        )}

        {getTrialStatusMessage() && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              ⏰ {getTrialStatusMessage()}
            </p>
          </div>
        )}

        {!shouldShowUpgrade && (
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Thank you for being a ScheduleBud subscriber! You have access to all premium features.
          </p>
        )}
      </div>

      {/* Upgrade Options - Only show for free/trial users */}
      {shouldShowUpgrade && (
        <>
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upgrade Your Plan
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
              Unlock all premium features with unlimited access to Canvas sync, AI syllabus extraction, document Q&A, and more.
            </p>
          </div>

          {/* Upgrade Buttons */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Student Monthly Plan */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Student
                </h4>
                <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
                  $3.99
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  Perfect for active students
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">50 document Q&A queries per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">Grade analytics & GPA tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">Unlimited syllabus AI extraction</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">Custom task types & colors</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">Email support & community</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgradeClick('https://buy.stripe.com/9B63cugQDaf96dva6Yf7i00', 'monthly')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Upgrade to Student
              </button>
              
              <div className="text-center mt-3">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  No credit card required for trial
                </p>
              </div>
            </div>

            {/* Academic Year Plan */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 relative">
              {/* Compact Back to School Badge */}
              <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-3 py-0.5 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap">
                  🎓 Back to School Special • Ends Sept 30th!
                </div>
              </div>

              <div className="text-center mb-4 mt-3">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Academic Year
                </h4>
                <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-2">
                  $19.99
                  <span className="text-sm font-normal text-gray-500">/year</span>
                </div>
                <div className="text-sm text-gray-500 line-through">
                  $24/year
                </div>
                
                {/* Coupon Code Highlight */}
                <div className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/30 border border-green-300 dark:border-green-600 rounded-lg p-3 mt-3">
                  <div className="text-sm font-bold text-green-800 dark:text-green-300">Use code: BACKTOSCHOOL2025</div>
                  <div className="text-xs text-green-700 dark:text-green-400">For $4.01 off</div>
                </div>
                
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">10 month access</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">Everything in Student</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">60% savings vs monthly</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-slate-300">No recurring payment stress</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgradeClick('https://buy.stripe.com/28E5kCdErcnhbxP0wof7i01', 'academic-year')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
              >
                Upgrade to Academic Year
              </button>
              
              <div className="text-center mt-3">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  No credit card required for trial
                </p>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-3 text-sm">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-green-800 dark:text-green-300">
                <span className="font-semibold">Secure Payment:</span> Powered by Stripe • Cancel anytime • No hidden fees • Student-friendly pricing
              </div>
            </div>
          </div>
        </>
      )}

      {/* Current Subscription Management */}
      {subscriptionStatus === 'active' && (
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Manage Subscription
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Need to update your payment method, view invoices, or cancel your subscription? Use the customer portal below.
          </p>
          <a
            href="https://billing.stripe.com/p/login/9B63cugQDaf96dva6Yf7i00"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Customer Portal
          </a>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSettingsTab;