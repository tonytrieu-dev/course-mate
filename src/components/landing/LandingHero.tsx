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
        
        {/* Subtle notebook paper lines (very faint) */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #3b82f6 24px)',
          backgroundSize: '100% 24px'
        }}></div>
        
        {/* Coffee ring stains as decorative elements */}
        <div className="absolute top-16 left-16 w-12 h-12 rounded-full border-2 border-amber-200/40 opacity-30"></div>
        <div className="absolute bottom-32 right-20 w-8 h-8 rounded-full border border-amber-300/30 opacity-25"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 rounded-full border border-orange-200/35 opacity-20"></div>
        
        {/* Student stress-to-success journey elements - SIMPLIFIED */}
        <div className="absolute inset-0 opacity-40">
          {/* Key stress element only */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-red-200 to-pink-200 rounded-xl transform rotate-6 mix-blend-multiply filter blur-2xl"></div>
          
          {/* Main success transformation */}
          <div className="absolute bottom-32 left-32 w-96 h-96 bg-gradient-to-tl from-blue-200/60 to-indigo-300/50 rounded-2xl mix-blend-multiply filter blur-3xl opacity-80"></div>
        </div>
        
        {/* Student workspace elements - ESSENTIAL ONLY */}
        <div className="absolute inset-0 opacity-12">
          {/* Key accent line */}
          <div className="absolute top-1/3 right-1/3 w-1 h-16 bg-gradient-to-b from-blue-400 to-indigo-400 rotate-12 rounded-full"></div>
          
          {/* Single highlighter mark */}
          <div className="absolute bottom-1/3 left-1/3 w-14 h-1.5 bg-yellow-300/50 rounded-full transform rotate-2"></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left relative">
            {/* Artistic productivity badge */}
            <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-white via-blue-50 to-indigo-100 text-blue-800 mb-8 border-2 border-blue-400/60 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl backdrop-blur-sm">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 bg-clip-text text-transparent">
                The student productivity tool that actually works
              </span>
            </div>
            
            {/* Artistic layered typography */}
            <div className="relative mb-8">
              {/* Background stress text - lighter colors */}
              <div className="absolute -top-3 -left-2 text-red-300/40 text-4xl font-black rotate-12 opacity-50 select-none">
                STRESSED?
              </div>
              <div className="absolute -top-1 right-10 text-orange-300/30 text-2xl font-bold -rotate-6 opacity-30 select-none">
                overwhelmed?
              </div>
              
              {/* Main artistic headline */}
              <h1 className="relative text-5xl md:text-6xl lg:text-8xl font-black leading-tight tracking-tight">
                <div className="space-y-1">
                  <div className="text-slate-800 hover:scale-105 transition-transform duration-300 leading-tight">
                    Stop Drowning in
                  </div>
                  <div className="text-red-500 hover:text-red-600 transition-colors duration-300 cursor-default leading-tight drop-shadow-sm">
                    DEADLINES.
                  </div>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 text-4xl md:text-5xl lg:text-6xl hover:scale-105 transition-transform duration-300 leading-relaxed pb-4 mt-3">
                    And Start Thriving!
                  </div>
                </div>
              </h1>
              
              {/* Artistic accent elements */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-70 shadow-sm"></div>
            </div>
            
            <div className="relative mb-8">
              {/* Value-focused description */}
              <div className="text-lg text-slate-700 leading-relaxed font-medium relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                <p className="mb-3 text-slate-800 text-xl font-semibold">
                  Stop wasting hours on manual busy work that steals time from your actual studies.
                </p>
                <p className="mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-xl">
                    Get automatic sync, AI syllabus processing, and document Q&A that actually saves time.
                  </span>
                </p>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-4">
                  <span className="text-blue-800 font-bold">⚡ Take back your time</span>
                  <span className="text-blue-700"> • Empower your academic success through automation</span>
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
              
              {/* Student Testimonial Header */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full text-base font-bold mb-4 inline-flex items-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-blue-400/50">
                  🎓 Built for students, by a student
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  "I used to waste hours on academic busy work..."
                </h3>
                <p className="text-lg text-slate-600 italic">
                  Now I focus on learning. Here's what changed everything:
                </p>
              </div>

              {/* Interactive Product Gallery */}
              <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-3xl p-1 shadow-2xl border border-blue-200/50 hover:shadow-3xl transition-all duration-500 overflow-hidden group mb-6">
                <LandingProductGallery />
                
                {/* Floating Gallery Tags */}
                <div className="absolute -top-2 -left-2 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                  🎬 INTERACTIVE GALLERY
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                  📱 SWIPE TO EXPLORE
                </div>
              </div>

              {/* Student Success Story */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-red-100/80 backdrop-blur-sm rounded-xl p-4 border border-red-200/50 text-center">
                  <div className="text-3xl mb-2">😰</div>
                  <div className="text-sm font-bold text-red-800">BEFORE</div>
                  <div className="text-xs text-red-700">Hours lost to manual tasks</div>
                </div>
                <div className="bg-green-100/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50 text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-sm font-bold text-green-800">AFTER</div>
                  <div className="text-xs text-green-700">Time for actual learning</div>
                </div>
              </div>

              {/* Interactive Gallery Caption */}
              <div className="text-center">
                <p className="text-base text-slate-700 font-medium bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-blue-200/40 shadow-lg">
                  <span className="text-blue-700 font-bold">Explore every ScheduleBud feature interactively</span>
                  <br />
                  <span className="text-sm text-slate-600 mt-1 inline-block">
                    Swipe through 7 slides showing the dashboard, Canvas sync, AI syllabus upload, grades, study tracking, mobile interface, and full demo video.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;