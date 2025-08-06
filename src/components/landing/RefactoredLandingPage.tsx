import React from 'react';
import LandingNavigation from './LandingNavigation';
import LandingHero from './LandingHero';
import LandingSocialProof from './LandingSocialProof';
import LandingFeatures from './LandingFeatures';
import LandingPricing from './LandingPricing';
import LandingFAQ from './LandingFAQ';
import LandingEarlyAccess from './LandingEarlyAccess';
import LandingCTA from './LandingCTA';
import LandingFooter from './LandingFooter';

interface RefactoredLandingPageProps {
  onGetStarted: () => void;
}

const RefactoredLandingPage: React.FC<RefactoredLandingPageProps> = ({ onGetStarted }) => {
  // Analytics tracking function
  const trackEvent = (eventName: string, properties?: any) => {
    // Placeholder for analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventName, properties);
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
      <LandingEarlyAccess onGetStarted={onGetStarted} trackEvent={trackEvent} />
      <LandingCTA onGetStarted={onGetStarted} />
      <LandingFooter />
    </div>
  );
};

export default RefactoredLandingPage;