import React, { useState } from 'react';
import UpgradeModal from './UpgradeModal';
import BillingButton, { BillingSection } from './BillingButton';
import Button from './ui/Button';
import { useSubscription } from '../contexts/SubscriptionContext';

/**
 * Test component for subscription UI components
 * This is a temporary component for testing the UpgradeModal and BillingButton
 * Remove this file once integration is complete
 */
const SubscriptionTest: React.FC = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalTrigger, setModalTrigger] = useState<'feature_limit' | 'ai_limit' | 'manual' | 'trial_ending'>('manual');
  
  const { subscriptionStatus, currentPlan, loading } = useSubscription();

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Subscription Component Test
        </h2>
        
        {/* Current Status */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Current Status:</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            <strong>Subscription:</strong> {subscriptionStatus}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            <strong>Plan:</strong> {currentPlan?.name || 'None'}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            <strong>Price:</strong> ${currentPlan?.price || 0}/month
          </p>
        </div>

        {/* Test Buttons for UpgradeModal */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Test UpgradeModal:</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              text="Manual Trigger"
              onClick={() => {
                setModalTrigger('manual');
                setShowUpgradeModal(true);
              }}
              variant="outline"
              size="sm"
            />
            <Button
              text="AI Limit Trigger"
              onClick={() => {
                setModalTrigger('ai_limit');
                setShowUpgradeModal(true);
              }}
              variant="outline"
              size="sm"
            />
            <Button
              text="Feature Limit Trigger"
              onClick={() => {
                setModalTrigger('feature_limit');
                setShowUpgradeModal(true);
              }}
              variant="outline"
              size="sm"
            />
            <Button
              text="Trial Ending Trigger"
              onClick={() => {
                setModalTrigger('trial_ending');
                setShowUpgradeModal(true);
              }}
              variant="outline"
              size="sm"
            />
          </div>
        </div>

        {/* Test BillingButton variants */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Test BillingButton:</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <BillingButton variant="primary" size="sm" />
              <BillingButton variant="outline" size="sm" />
              <BillingButton variant="ghost" size="sm" showIcon={false} />
            </div>
            <BillingButton variant="secondary" size="md" fullWidth />
          </div>
        </div>

        {/* Test BillingSection */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Test BillingSection:</h3>
          <BillingSection />
        </div>
      </div>

      {/* UpgradeModal */}
      <UpgradeModal
        showModal={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger={modalTrigger}
      />
    </div>
  );
};

export default SubscriptionTest;