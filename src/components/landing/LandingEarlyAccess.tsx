import React from 'react';
import Button from '../ui/Button';

interface LandingEarlyAccessProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingEarlyAccess: React.FC<LandingEarlyAccessProps> = ({ onGetStarted, trackEvent }) => {
  return (
    <>
      {/* Transition from FAQ */}
      <div className="h-8 bg-gradient-to-b from-slate-50 to-indigo-50/80"></div>
      
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-200 relative overflow-hidden">
      {/* Light artistic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-indigo-50/80 to-blue-100/70"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-100/60 via-indigo-100/70 to-white/80"></div>
        
        {/* Light floating elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-indigo-300/50 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-tl from-indigo-200/35 to-purple-300/45 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-8 tracking-tight">
          Be Part of{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 transition-all duration-500 drop-shadow-sm">
            Something Better
          </span>
        </h2>
        
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-blue-300/50 shadow-3xl hover:shadow-4xl transition-all duration-500 mb-10 relative overflow-hidden">
          {/* Inner artistic elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 to-blue-200/30 opacity-60"></div>
          <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full"></div>
          <div className="absolute bottom-2 left-2 w-8 h-8 bg-gradient-to-tl from-blue-200/40 to-transparent rounded-full"></div>
          
          <p className="text-xl text-slate-700 leading-relaxed font-medium max-w-3xl mx-auto relative z-10">
            <span className="text-blue-700 font-bold">You've seen the complete solution.</span> Now get exclusive early access before the public launch. 
            Join the founding group of students who get premium features free, direct developer access, and the chance to shape what gets built next.
          </p>
        </div>
        
        <Button
          text="Join the Founding Group"
          onClick={() => {
            trackEvent('early_access_clicked', { location: 'early_access_section' });
            onGetStarted();
          }}
          variant="primary"
          size="lg"
          ariaLabel="Join the founding group of ScheduleBud users"
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          dataTestId="early-access-btn"
        />
        
        <p className="text-sm text-slate-600 mt-4 font-medium italic">
          Premium features included while we build together
        </p>
      </div>
    </section>
    </>
  );
};

export default LandingEarlyAccess;