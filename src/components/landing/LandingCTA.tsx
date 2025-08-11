import React from 'react';
import Button from '../ui/Button';

interface LandingCTAProps {
  onGetStarted: () => void;
}

const LandingCTA: React.FC<LandingCTAProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--primary-cream)]/40 to-white relative">
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl p-6 sm:p-8 shadow-xl" style={{backgroundColor: 'rgba(255, 248, 220, 0.95)', border: '1px solid rgba(37, 99, 235, 0.3)'}}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Ready to <span style={{color: 'var(--primary-navy)'}}>Automate Your Assignments?</span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            <span className="font-bold" style={{color: 'var(--cta-orange)'}}>Stop wasting 3+ hours every quarter on setup. Start studying.</span>
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                text="Get Started Free"
                onClick={onGetStarted}
                variant="primary"
                size="lg"
                className="shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold"
                ariaLabel="Start using ScheduleBud for free"
                dataTestId="final-cta-btn"
              />
              <Button
                text="See Pricing"
                variant="outline"
                size="lg"
                className="shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold bg-white/80 backdrop-blur-sm"
                href="#pricing"
                ariaLabel="View ScheduleBud pricing plans"
              />
            </div>
          </div>
        </div>
    </section>
  );
};

export default LandingCTA;