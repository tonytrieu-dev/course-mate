import React from 'react';
import Button from '../ui/Button';

interface LandingCTAProps {
  onGetStarted: () => void;
}

const LandingCTA: React.FC<LandingCTAProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 relative overflow-hidden">
      {/* Light artistic elements */}
      <div className="absolute inset-0">
        {/* Multi-layer light gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blue-50/80 to-indigo-100/70"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-100/50 via-indigo-100/60 to-white/80"></div>
        
        {/* Dynamic light orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-200/60 to-indigo-300/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tl from-indigo-200/50 to-blue-300/60 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-300/40 to-indigo-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
        
        {/* Light artistic accent lines */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/3 w-2 h-32 bg-gradient-to-b from-blue-500 to-transparent rotate-45"></div>
          <div className="absolute bottom-1/3 left-1/4 w-2 h-24 bg-gradient-to-t from-indigo-500 to-transparent -rotate-12"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-20 bg-gradient-to-b from-blue-500 to-transparent rotate-12"></div>
          
          {/* Light floating particles */}
          <div className="absolute top-20 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-indigo-400 rounded-full opacity-60"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-40"></div>
        </div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Light artistic container */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-12 border border-blue-300/50 shadow-3xl hover:shadow-4xl transition-all duration-500 relative overflow-hidden">
          {/* Inner artistic elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-200/30 opacity-60"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-tl from-indigo-200/40 to-transparent rounded-full"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight drop-shadow-sm">
              Ready to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Automate Your Assignments?
              </span>
            </h2>
            <p className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto font-medium leading-relaxed bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/40">
              <span className="text-blue-700 font-bold">Start with our free plan today.</span>
              <br />
              <span className="text-slate-600 text-lg italic mt-2 block">Built by a UCR student who got tired of copy-paste hell.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                text="Get Started Free"
                onClick={onGetStarted}
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold"
                ariaLabel="Start using ScheduleBud for free"
                dataTestId="final-cta-btn"
              />
              <Button
                text="Watch Demo"
                variant="outline"
                size="lg"
                className="border-2 border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold bg-white/80 backdrop-blur-sm"
                href="#features"
                ariaLabel="Watch ScheduleBud demo video"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;