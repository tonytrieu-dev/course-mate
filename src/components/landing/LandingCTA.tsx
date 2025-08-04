import React from 'react';
import Button from '../ui/Button';

interface LandingCTAProps {
  onGetStarted: () => void;
}

const LandingCTA: React.FC<LandingCTAProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to boost your GPA with smarter study planning?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join students who've ditched manual task management. Start free today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            text="Get Started Free"
            onClick={onGetStarted}
            variant="outline"
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
            ariaLabel="Start using ScheduleBud for free"
            dataTestId="final-cta-btn"
          />
          <Button
            text="Watch Demo"
            variant="ghost"
            size="lg"
            className="border-2 border-white text-white hover:bg-white hover:text-blue-600"
            href="#features"
            ariaLabel="Watch ScheduleBud demo video"
          />
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;