import React from 'react';
import LandingNavigation from './landing/LandingNavigation';
import LandingHero from './landing/LandingHero';
import LandingSocialProof from './landing/LandingSocialProof';
import LandingFeatures from './landing/LandingFeatures';
import LandingPricing from './landing/LandingPricing';
import LandingFAQ from './landing/LandingFAQ';
import LandingCTA from './landing/LandingCTA';
import LandingFooter from './landing/LandingFooter';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  // Analytics tracking function
  const trackEvent = (eventName: string, properties?: any) => {
    // Placeholder for analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      // Analytics event tracked
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