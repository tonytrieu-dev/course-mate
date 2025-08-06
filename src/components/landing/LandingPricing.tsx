import React from 'react';
import Button from '../ui/Button';

interface LandingPricingProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingPricing: React.FC<LandingPricingProps> = ({ onGetStarted, trackEvent }) => {
  const checkIcon = (
    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const crossIcon = (
    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section id="pricing" className="py-32 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 relative overflow-hidden">
      {/* Light artistic pricing background */}
      <div className="absolute inset-0">
        {/* Primary light layers for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-indigo-50/90 to-blue-100/80"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-100/60 via-indigo-100/70 to-white/80"></div>
        
        {/* Light dynamic artistic elements */}
        <div className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-200/50 to-indigo-300/60 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute bottom-32 left-20 w-96 h-96 bg-gradient-to-tl from-indigo-200/40 to-purple-300/50 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-300/40 to-cyan-200/60 rounded-full mix-blend-multiply filter blur-xl opacity-40"></div>
        
        {/* Light artistic accent lines for student energy */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/4 w-2 h-40 bg-gradient-to-b from-blue-500 to-transparent rotate-45"></div>
          <div className="absolute bottom-1/3 left-1/4 w-2 h-32 bg-gradient-to-t from-indigo-500 to-transparent -rotate-12"></div>
          <div className="absolute top-2/3 right-1/3 w-1 h-24 bg-gradient-to-b from-cyan-500 to-transparent rotate-12"></div>
          
          {/* Light floating particles */}
          <div className="absolute top-20 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-indigo-400 rounded-full opacity-60"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-40"></div>
        </div>
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 relative z-10">
          {/* Light artistic title treatment */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 tracking-tight relative">
            <span className="text-slate-800">Simple, </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 transition-all duration-500 drop-shadow-sm">
              student-friendly
            </span>
            <span className="text-slate-800"> pricing</span>
            
            {/* Light artistic underline accent */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 rounded-full opacity-70 shadow-sm"></div>
          </h2>
          
          {/* Light enhanced subtitle with artistic container */}
          <div className="max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl text-slate-700 font-medium bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-blue-300/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-20 relative z-10">
          {/* Free Plan - Light artistic redesign */}
          <div className="bg-gradient-to-br from-white/95 to-slate-100/90 backdrop-blur-lg rounded-3xl p-10 border-2 border-slate-300/60 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
            {/* Light artistic background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200/20 to-gray-100/30 opacity-50"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-slate-200/30 to-transparent rounded-full"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-slate-800 mb-3">Free Forever</h3>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-gray-800 mb-3">$0</div>
                <p className="text-slate-600 text-lg">Perfect for getting started</p>
              </div>
            
              <ul className="space-y-5 mb-10">
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-green-500/30 border border-green-500/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Basic task management</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-green-500/30 border border-green-500/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Canvas calendar sync</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-green-500/30 border border-green-500/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">5 document Q&A queries per day</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-green-500/30 border border-green-500/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Basic grade tracking</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-green-500/30 border border-green-500/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Basic file storage</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-green-500/30 border border-green-500/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Cross-platform sync</span>
                </li>
              </ul>

              <Button
                text="Start Free"
                onClick={() => {
                  trackEvent('get_started_clicked', { location: 'pricing', plan: 'free' });
                  onGetStarted();
                }}
                variant="secondary"
                className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white font-bold py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                ariaLabel="Start with ScheduleBud free plan"
                dataTestId="free-plan-btn"
              />
            </div>
          </div>

          {/* Student Plan - Light artistic redesign */}
          <div className="bg-gradient-to-br from-blue-100/95 to-indigo-200/90 backdrop-blur-lg rounded-3xl p-10 border-4 border-blue-400/80 relative shadow-3xl transform scale-105 hover:scale-110 transition-all duration-500 overflow-hidden">
            {/* Light artistic background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-indigo-400/40 opacity-40"></div>
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-200/40 to-transparent rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tl from-indigo-200/30 to-transparent rounded-full"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-slate-800 mb-3">Student</h3>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-800 to-cyan-700 mb-3 drop-shadow-sm">
                  $5<span className="text-2xl">/month</span>
                </div>
                <p className="text-blue-800 font-semibold text-xl mb-2">Everything you need to dominate college</p>
                <p className="text-blue-700 font-medium">7-day free trial • Cancel anytime • Best value</p>
              </div>
            
              <ul className="space-y-5 mb-10">
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-blue-600/40 border border-blue-600/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-semibold">Everything in Free</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-blue-600/40 border border-blue-600/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">50 document Q&A queries per day</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-blue-600/40 border border-blue-600/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">Advanced study analytics</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-blue-600/40 border border-blue-600/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">Unlimited syllabus AI extraction</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-blue-600/40 border border-blue-600/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">Custom task types & colors</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-blue-600/40 border border-blue-600/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">Priority support</span>
                </li>
              </ul>

              <Button
                text="Try Student Free"
                onClick={() => {
                  trackEvent('get_started_clicked', { location: 'pricing', plan: 'student' });
                  onGetStarted();
                }}
                variant="primary"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                ariaLabel="Start Student plan free trial"
                dataTestId="student-plan-btn"
              />
            </div>
          </div>
        </div>


        <div className="text-center mt-16 relative z-10">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 max-w-3xl mx-auto border border-blue-300/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <h4 className="text-2xl font-bold text-blue-800 mb-4">Why $5/month?</h4>
            <p className="text-slate-700 text-lg leading-relaxed">
              Because I understand the struggles of being a student. ScheduleBud keeps it affordable 
              at just $5 - less than a coffee. You get Canvas sync, document Q&A assistant (50 queries/day), 
              smart syllabus upload, advanced analytics, and priority support.
            </p>
          </div>
          <p className="text-blue-600 mt-8 text-lg">
            7-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;