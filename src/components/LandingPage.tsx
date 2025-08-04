import React from 'react';
import RefactoredLandingPage from './landing/RefactoredLandingPage';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return <RefactoredLandingPage onGetStarted={onGetStarted} />;
};

export default LandingPage;