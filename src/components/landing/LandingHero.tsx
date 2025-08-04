import React from 'react';
import Button from '../ui/Button';

interface LandingHeroProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted, trackEvent }) => {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-white/30"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6 border border-blue-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Built for students, by a student
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Stop Drowning in 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Deadlines</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              ScheduleBud was built to sync with Canvas, track your assignments, and help you build smarter study habits. Go from overwhelmed to on top of your work.
            </p>
            
            {/* Enhanced Benefit Bullets */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-green-100">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-700">Save hours weekly</span>
              </div>
              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-blue-100">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-700">Sync with Canvas</span>
              </div>
              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-purple-100">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-700">Free forever plan</span>
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
                className="border-2 border-gray-300 hover:border-blue-300 bg-white/80 backdrop-blur-sm hover:bg-blue-50 transform hover:-translate-y-0.5 transition-all duration-200"
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
          
          {/* Enhanced Hero Visual */}
          <div className="text-center lg:text-right">
            <div className="relative">
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-200 rounded-lg rotate-12 opacity-80 shadow-lg"></div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-200 rounded-full opacity-80 shadow-lg animate-bounce"></div>
              <div className="absolute bottom-4 -left-2 w-8 h-8 bg-pink-200 rounded-lg -rotate-12 opacity-80 shadow-lg"></div>
              
              <div className="relative bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl p-8 shadow-2xl border border-white/50 backdrop-blur-sm">
                <img 
                  src="/api/placeholder/600/400" 
                  alt="ScheduleBud app interface showing Canvas integration and task management" 
                  className="w-full h-80 object-cover rounded-xl shadow-lg border border-white/20"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl"></div>
                <p className="text-sm text-gray-600 mt-6 italic font-medium">
                  ✨ See ScheduleBud in action - Canvas sync, AI assistance, and study analytics
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