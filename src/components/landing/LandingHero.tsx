import React from 'react';
import Button from '../ui/Button';
import LandingProductGallery from './LandingProductGallery';

interface LandingHeroProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted, trackEvent }) => {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Student Workspace Artistic Background */}
      <div className="absolute inset-0">
        {/* Base light gradient with notebook paper texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100"></div>
        
        {/* Authentic notebook paper lines (more visible) */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #3b82f6 24px)',
          backgroundSize: '100% 24px'
        }}></div>
        
        {/* Left margin line like real notebook paper */}
        <div className="absolute left-20 top-0 bottom-0 w-px bg-red-300/20"></div>
        
        {/* Authentic student workspace elements */}
        <div className="absolute inset-0 opacity-25">
          {/* Coffee rings - multiple overlapping like real stains */}
          <div className="absolute top-20 left-32 w-12 h-12 rounded-full border-2 border-amber-200/40"></div>
          <div className="absolute top-22 left-34 w-8 h-8 rounded-full border border-amber-300/30"></div>
          <div className="absolute bottom-40 right-32 w-10 h-10 rounded-full border border-orange-200/35"></div>
          
          {/* Pencil mark - like real handwriting */}
          <div className="absolute top-40 right-40 w-16 h-1 bg-slate-400/20 rounded-full transform rotate-12"></div>
          
          {/* Single success element - clean and minimal */}
          <div className="absolute bottom-32 left-32 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-indigo-200/30 rounded-xl filter blur-2xl opacity-60"></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left relative">
            {/* Artistic productivity badge */}
            <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-white via-blue-50 to-indigo-100 text-blue-800 mb-8 border-2 border-blue-400/60 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl backdrop-blur-sm">
              <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 bg-clip-text text-transparent">
                The student productivity tool that delivers
              </span>
            </div>
            
            {/* Artistic layered typography */}
            <div className="relative mb-8">
              
              {/* Main artistic headline - DEADLINES as primary anchor */}
              <h1 className="relative text-6xl md:text-7xl lg:text-9xl font-black leading-tight tracking-tight">
                <div className="space-y-2">
                  <div className="text-slate-800 text-4xl md:text-5xl lg:text-6xl leading-tight">
                    Stop Drowning in
                  </div>
                  <div className="text-red-500 hover:text-red-600 transition-colors duration-300 cursor-default leading-tight drop-shadow-lg text-7xl md:text-8xl lg:text-10xl font-black">
                    DEADLINES
                  </div>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 text-4xl md:text-5xl lg:text-6xl hover:scale-105 transition-transform duration-300 leading-relaxed pb-4 mt-4">
                    And Start Thriving!
                  </div>
                </div>
              </h1>
              
              {/* Artistic accent elements */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-70 shadow-sm"></div>
            </div>
            
            <div className="relative mb-8">
              {/* Streamlined time empowerment message */}
              <div className="text-center relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 mb-4">
                  Take back your time. Focus on learning, not organizing.
                </p>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-4">
                  <span className="text-blue-800 font-bold">Built for students, by a student</span>
                  <span className="text-blue-700"> • I use ScheduleBud for my own UCR classes</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
              <Button
                text="Try ScheduleBud for Free"
                onClick={() => {
                  trackEvent('get_started_clicked', { location: 'hero' });
                  onGetStarted();
                }}
                size="lg"
                ariaLabel="Start using ScheduleBud for free"
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                dataTestId="hero-get-started-btn"
              />
              <Button
                text="See How It Works"
                variant="outline"
                size="lg"
                href="#features"
                ariaLabel="Learn about ScheduleBud features"
                className="border-2 border-gray-300 hover:border-blue-300 bg-white/90 backdrop-blur-sm hover:bg-blue-50 transform hover:-translate-y-0.5 transition-all duration-200"
                dataTestId="hero-demo-btn"
              />
            </div>
            <p className="text-sm text-gray-500 flex items-center justify-center lg:justify-start">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free forever plan available • No credit card required
            </p>

          </div>
          
          {/* Full-Height Product Demo Showcase */}
          <div className="text-center lg:text-right h-full flex flex-col justify-center">
            <div className="relative h-full">
              
              {/* Clean Student Badge */}
              <div className="mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full text-base font-bold mb-4 inline-flex items-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-blue-400/50">
                  Built for students, by a student.
                </div>
              </div>

              {/* Interactive Product Gallery - Moved Up */}
              <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-3xl p-1 shadow-2xl border border-blue-200/50 hover:shadow-3xl transition-all duration-500 overflow-hidden group" style={{minHeight: '500px'}}>
                <LandingProductGallery />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;