import React, { useEffect } from 'react';
import LandingNavigation from './landing/LandingNavigation';
import LandingHero from './landing/LandingHero';
import LandingSocialProof from './landing/LandingSocialProof';
import LandingFeatures from './landing/LandingFeatures';
import LandingPricing from './landing/LandingPricing';
import LandingFAQ from './landing/LandingFAQ';
import LandingCTA from './landing/LandingCTA';
import LandingFooter from './landing/LandingFooter';
import { analyticsService } from '../services/analyticsService';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  // Track landing page view on component mount
  useEffect(() => {
    analyticsService.trackLandingPageView();
  }, []);

  // Enhanced analytics tracking function with A/B test support
  const trackEvent = (eventName: string, properties?: any) => {
    // Handle specific conversion events
    switch (eventName) {
      case 'get_started_clicked':
        analyticsService.trackGetStartedClick(properties?.location || 'unknown');
        break;
      case 'pricing_viewed':
        analyticsService.trackPricingView();
        break;
      case 'plan_selected':
        analyticsService.trackPlanSelection(properties?.plan || 'unknown');
        break;
      case 'feature_interaction':
        analyticsService.trackFeatureInteraction(properties?.feature || 'unknown');
        break;
      default:
        analyticsService.track(eventName, properties);
    }

    // Also send to external analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavigation onGetStarted={onGetStarted} trackEvent={trackEvent} />
      <LandingHero onGetStarted={onGetStarted} trackEvent={trackEvent} />
      <LandingSocialProof />
      <LandingFeatures />
      <LandingPricing onGetStarted={onGetStarted} trackEvent={trackEvent} />
      <LandingFAQ />
      <LandingCTA onGetStarted={onGetStarted} />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;