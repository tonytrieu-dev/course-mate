import React from 'react';
import Button from '../ui/Button';

interface LandingPricingProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingPricing: React.FC<LandingPricingProps> = ({ onGetStarted, trackEvent }) => {
  const checkIcon = (
    <svg className="w-5 h-5 text-[#9CAF88] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const crossIcon = (
    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section id="pricing" className="py-32 relative overflow-hidden bg-gradient-to-br from-white to-[var(--primary-cream)]/50">
      {/* Clean, professional background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full filter blur-3xl opacity-20" style={{backgroundColor: 'var(--primary-navy)'}}></div>
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 relative z-10">
          {/* Clean title focused on honesty and trust */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-12 tracking-tight leading-tight">
            <span className="text-slate-800">Simple, Honest </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-navy)] via-[var(--deep-navy)] to-[var(--accent-navy)] hover:from-[var(--deep-navy)] hover:via-[var(--accent-navy)] hover:to-[var(--deep-navy)] transition-all duration-500 drop-shadow-sm">
              Pricing
            </span>
          </h2>
          
          {/* Single powerful student message with cream theme - enhanced spacing */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="backdrop-blur-lg rounded-2xl p-8 md:p-10 border-2 shadow-xl transition-all duration-300 relative overflow-hidden" style={{background: 'var(--rich-cream)', borderColor: 'var(--warm-beige)'}}>
              {/* Premium gold decoration */}
              <div className="absolute top-3 right-5 w-8 h-8 border-2 rounded-full opacity-50" style={{borderColor: 'var(--premium-gold)'}}></div>
              
              <div className="relative z-10">
                <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed">
                  <span className="font-bold" style={{color: 'var(--accent-navy)'}}>Start with a powerful free plan.</span>
                  <br />
                  Upgrade only when you're ready to automate your academic scheduling workflow.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto mb-24 relative z-10">
          {/* Free Plan - PREMIUM CREAM-DOMINANT theme */}
          <div className="backdrop-blur-lg rounded-3xl p-6 lg:p-8 border-2 shadow-2xl transition-all duration-300 relative overflow-hidden" style={{background: 'linear-gradient(135deg, var(--primary-cream) 0%, var(--rich-cream) 50%, var(--secondary-cream) 100%)', borderColor: 'var(--warm-beige)'}}>
            {/* Premium cream background elements */}
            <div className="absolute inset-0 opacity-60" style={{background: 'linear-gradient(to bottom right, var(--rich-cream) 0%, var(--primary-cream) 100%)'}}></div>
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full" style={{background: 'linear-gradient(135deg, var(--premium-gold), transparent)', opacity: '0.3'}}></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">Free Forever</h3>
                <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-gray-800 mb-2">$0</div>
                <p className="text-slate-600 text-base lg:text-lg">Perfect for getting started</p>
              </div>
            
              <ul className="space-y-4 mb-8">
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-base lg:text-lg font-medium">Unlimited task management</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-base lg:text-lg font-medium">Canvas calendar sync</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">3 document Q&A queries per day</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">File storage (up to 25 files)</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Cross-platform sync</span>
                </li>
              </ul>

              <Button
                text="Start Free"
                onClick={() => {
                  // TODO: Uncomment for landing page analytics
                  // trackEvent('get_started_clicked', { location: 'pricing', plan: 'free' });
                  onGetStarted();
                }}
                variant="outline"
                className="w-full border-2 border-[var(--primary-navy)] text-[var(--primary-navy)] bg-white hover:bg-[var(--primary-navy)] hover:text-white font-bold py-3 lg:py-4 text-base lg:text-lg transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                ariaLabel="Start with ScheduleBud free plan"
                dataTestId="free-plan-btn"
              />
            </div>
          </div>

          {/* Student Academic Year Plan - Middle position with BACKTOSCHOOL2025 coupon - PREMIUM HIGHLIGHTED */}
          <div className="backdrop-blur-lg rounded-3xl p-6 lg:p-8 border-4 relative shadow-3xl transform scale-105 hover:scale-110 transition-all duration-500 overflow-hidden" style={{background: 'linear-gradient(135deg, var(--rich-cream) 0%, var(--primary-cream) 40%, var(--secondary-cream) 80%, var(--tertiary-cream) 100%)', borderColor: 'var(--premium-gold)'}}>
            {/* Back to School Special Banner */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg border border-orange-300 animate-pulse">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🎓</span>
                  <span className="whitespace-nowrap">Back to School Special • Ends Sept 30th!</span>
                </div>
              </div>
            </div>
            
            {/* Premium cream with gold highlight elements */}
            <div className="absolute inset-0 opacity-50" style={{background: 'linear-gradient(to bottom right, var(--premium-gold) 0%, var(--rich-cream) 50%, var(--primary-cream) 100%)', opacity: '0.15'}}></div>
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full" style={{background: 'linear-gradient(135deg, var(--premium-gold), transparent)', opacity: '0.3'}}></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full" style={{background: 'linear-gradient(to top left, var(--warm-gold), transparent)', opacity: '0.25'}}></div>
            
            {/* --- CHANGE 1: Reduced top padding from pt-24 to pt-16 --- */}
            <div className="relative z-10 pt-16"> 
              <div className="text-center mb-10">
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6">Academic Year</h3>
                
                {/* Promotional Pricing Display */}
                <div className="mb-4">
                  <div className="text-4xl lg:text-5xl font-black drop-shadow-sm" style={{color: 'var(--accent-navy)'}}>
                    $19.99<span className="text-xl lg:text-2xl">/year</span>
                  </div>
                  <div className="text-lg text-gray-500 line-through">
                    $24/year
                  </div>
                </div>
                
                {/* Coupon Code Highlight */}
                <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-300 rounded-lg p-3 mb-4">
                  <div className="text-sm font-bold text-green-800">Use code: BACKTOSCHOOL2025</div>
                  <div className="text-xs text-green-700">For $4.01 off</div>
                </div>
              </div>
            
              <ul className="space-y-4 mb-8">
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-base lg:text-lg font-semibold">10 month access</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-base lg:text-lg font-semibold">Everything in Student</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-base lg:text-lg font-medium">60% savings vs monthly</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-base lg:text-lg font-medium">No recurring payment stress</span>
                </li>
              </ul>

              <Button
                text="Start Your 7-Day Free Trial"
                onClick={() => {
                  // TODO: Uncomment for landing page analytics
                  // trackEvent('get_started_clicked', { location: 'pricing', plan: 'student-academic' });
                  onGetStarted();
                }}
                variant="cta-orange"
                className="w-full font-bold py-3 lg:py-4 text-base lg:text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                ariaLabel="Start Academic Year plan free trial"
                dataTestId="student-academic-plan-btn"
              />
              
              {/* --- CHANGE 2: Combined the two text lines into one, removed checkmarks --- */}
              <div className="text-center mt-3">
                <p className="text-sm font-medium text-gray-600">
                  No credit card required for trial • Cancel anytime
                </p>
              </div>
              
            </div>
          </div>

          {/* Student Monthly Plan - Toned down styling */}
          <div className="backdrop-blur-lg rounded-3xl p-6 lg:p-8 border-2 shadow-2xl transition-all duration-300 relative overflow-hidden" style={{background: 'linear-gradient(135deg, var(--primary-cream) 0%, var(--rich-cream) 50%, var(--secondary-cream) 100%)', borderColor: 'var(--warm-beige)'}}>
            {/* Subtle background elements */}
            <div className="absolute inset-0 opacity-60" style={{background: 'linear-gradient(to bottom right, var(--rich-cream) 0%, var(--primary-cream) 100%)'}}></div>
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full" style={{background: 'linear-gradient(135deg, var(--premium-gold), transparent)', opacity: '0.3'}}></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">Student</h3>
                <div className="text-4xl lg:text-5xl font-black mb-2 drop-shadow-sm" style={{color: 'var(--accent-navy)'}}>
                  $3.99<span className="text-xl lg:text-2xl">/month</span>
                </div>
              </div>
            
              <ul className="space-y-4 mb-8">
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-base lg:text-lg font-semibold">Everything in Free</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-5 h-5 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3 h-3 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-base lg:text-lg font-medium">50 document Q&A queries per day</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Grade analytics & GPA tracking</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Unlimited syllabus AI extraction</span>
                </li>
              </ul>

              <Button
                text="Start Your 7-Day Free Trial"
                onClick={() => {
                  // TODO: Uncomment for landing page analytics
                  // trackEvent('get_started_clicked', { location: 'pricing', plan: 'student-monthly' });
                  onGetStarted();
                }}
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 font-bold py-3 lg:py-4 text-base lg:text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                ariaLabel="Start Student plan free trial"
                dataTestId="student-monthly-plan-btn"
              />
              
              {/* Combined badges */}
              <div className="text-center mt-3">
                <p className="text-sm font-medium text-gray-600">
                  No credit card required for trial • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default LandingPricing;