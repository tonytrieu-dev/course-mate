import React from 'react';
import Button from '../ui/Button';

interface LandingHeroProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted, trackEvent }) => {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Light artistic background - stress to relief journey */}
      <div className="absolute inset-0">
        {/* Base light gradient - emotional journey from chaos to calm */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50/80 to-blue-100"></div>
        
        {/* Light morphing elements - stress transforming to organization */}
        <div className="absolute inset-0 opacity-60">
          {/* Chaotic deadline stress bubbles - now light and airy */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-red-200 to-orange-300 rounded-full mix-blend-multiply filter blur-2xl animate-bounce" style={{animationDuration: '3s'}}></div>
          <div className="absolute top-40 right-40 w-24 h-24 bg-gradient-to-br from-red-300 to-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-bounce" style={{animationDelay: '1s', animationDuration: '2.5s'}}></div>
          <div className="absolute top-32 right-72 w-16 h-16 bg-gradient-to-br from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-lg animate-bounce" style={{animationDelay: '0.5s', animationDuration: '2s'}}></div>
          
          {/* Transforming to calm organization - bright blues and indigos */}
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tl from-blue-200/80 to-indigo-300/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="absolute bottom-40 left-40 w-64 h-64 bg-gradient-to-br from-indigo-200/70 to-blue-300/50 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
          
          {/* Central calm focus - soft and bright */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-100/50 to-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        </div>
        
        {/* Artistic overlay patterns - light and subtle */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/3 w-1 h-20 bg-blue-500 rotate-45"></div>
          <div className="absolute bottom-1/4 left-1/4 w-1 h-16 bg-indigo-500 -rotate-12"></div>
          <div className="absolute top-1/3 left-1/2 w-1 h-12 bg-purple-500 rotate-12"></div>
          
          {/* Light floating particles */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-indigo-400 rounded-full opacity-60"></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-purple-400 rounded-full opacity-50"></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left relative">
            {/* Artistic student badge with enhanced light theme */}
            <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-white via-blue-50 to-indigo-100 text-blue-800 mb-8 border-2 border-blue-400/60 hover:scale-110 hover:rotate-1 transition-all duration-300 shadow-lg hover:shadow-2xl backdrop-blur-sm">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 bg-clip-text text-transparent">
                Built for students, by a student
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
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-orange-500 hover:scale-110 transition-all duration-500 cursor-default leading-tight drop-shadow-sm">
                    DEADLINES
                  </div>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 text-4xl md:text-5xl lg:text-6xl hover:scale-105 transition-transform duration-300 leading-relaxed pb-4 mt-3">
                    Start Thriving
                  </div>
                </div>
              </h1>
              
              {/* Artistic accent elements */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-70 shadow-sm"></div>
            </div>
            
            <div className="relative">
              {/* Student-focused messaging with enhanced light design */}
              <p className="text-lg md:text-xl text-slate-700 mb-8 leading-relaxed font-medium relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-blue-200/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                <strong className="text-slate-900">"Sunday nights copying Canvas assignments?"</strong> Been there. 
                <strong className="text-slate-900">"Adding every exam date manually?"</strong> Done that. 
                <br /><br />
                <span className="text-blue-700 font-semibold">I'm a UCR computer engineering student</span> who got fed up with the chaos. 
                ScheduleBud automatically syncs your Canvas assignments, uses AI to extract tasks from syllabi, and actually keeps you organized. 
                <br /><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 font-bold text-xl">
                  No more Sunday night assignment copying sessions.
                </span>
              </p>
            </div>
            
            {/* Key Benefits */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
              <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl px-5 py-3 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-bold text-slate-800">Stop manual copying</span>
              </div>
              <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl px-5 py-3 shadow-lg border border-indigo-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-slate-800">Sync with Canvas</span>
              </div>
              <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl px-5 py-3 shadow-lg border border-purple-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="font-bold text-slate-800">Ask questions about your docs</span>
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
          
          {/* Hero Visual */}
          <div className="text-center lg:text-right">
            <div className="relative">
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
                <img 
                  src="/api/placeholder/600/400" 
                  alt="ScheduleBud app interface showing Canvas integration and task management" 
                  className="w-full h-80 object-cover rounded-xl shadow-lg"
                  loading="lazy"
                />
                <p className="text-sm text-slate-600 mt-6 font-medium">
                  See ScheduleBud in action: Canvas sync, smart syllabus upload, document Q&A, and study analytics
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