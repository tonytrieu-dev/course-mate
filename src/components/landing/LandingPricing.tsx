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
    <section id="pricing" className="py-32 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #ffffff 0%, var(--primary-cream) 25%, rgba(37, 99, 235, 0.05) 60%, rgba(30, 58, 138, 0.08) 100%)'}}>
      {/* ROYAL BLUE DOMINANT with Premium Cream Accents */}
      <div className="absolute inset-0">
        {/* Royal blue dominant layers */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom right, rgba(37, 99, 235, 0.05) 0%, rgba(255, 248, 220, 0.6) 40%, rgba(37, 99, 235, 0.08) 80%, rgba(30, 58, 138, 0.1) 100%)'}}></div>
        <div className="absolute inset-0" style={{background: 'linear-gradient(to top left, rgba(30, 58, 138, 0.06) 0%, rgba(255, 248, 220, 0.5) 50%, #ffffff 100%)'}}></div>
        
        {/* Royal blue artistic elements */}
        <div className="absolute top-20 right-20 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-50" style={{background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(30, 58, 138, 0.12))'}}></div>
        <div className="absolute bottom-32 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl opacity-45" style={{background: 'linear-gradient(to top left, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.08))'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full mix-blend-multiply filter blur-xl opacity-35" style={{background: 'linear-gradient(to right, rgba(37, 99, 235, 0.1), rgba(59, 130, 246, 0.08))'}}></div>
        
        {/* Premium cream accent touches for warmth */}
        <div className="absolute top-40 right-1/3 w-60 h-60 rounded-full filter blur-2xl opacity-60" style={{backgroundColor: 'rgba(255, 248, 220, 0.8)'}}></div>
        <div className="absolute bottom-40 left-1/3 w-48 h-48 rounded-full filter blur-xl opacity-50" style={{backgroundColor: 'rgba(212, 165, 116, 0.15)'}}></div>
        
        {/* Blue artistic accent lines */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/4 w-2 h-40 bg-gradient-to-b from-[var(--primary-navy)] to-transparent rotate-45"></div>
          <div className="absolute bottom-1/3 left-1/4 w-2 h-32 bg-gradient-to-t from-[var(--primary-navy)] to-transparent -rotate-12"></div>
          <div className="absolute top-2/3 right-1/3 w-1 h-24 bg-gradient-to-b from-[var(--primary-navy)] to-transparent rotate-12"></div>
          
          {/* Mixed floating elements */}
          <div className="absolute top-20 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 rounded-full opacity-50" style={{backgroundColor: 'var(--premium-gold)'}}></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-indigo-400 rounded-full opacity-40"></div>
        </div>
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 relative z-10">
          {/* Simple Value Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-[var(--primary-navy)] to-[var(--royal-blue)] text-white px-6 py-3 rounded-full text-base font-bold mb-6 shadow-lg hover:scale-105 transition-all duration-300">
            <span>Simple Pricing</span>
          </div>
          
          {/* Clean title focused on choice */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-12 tracking-tight">
            <span className="text-slate-800">Choose Your </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-navy)] via-[var(--deep-navy)] to-[var(--accent-navy)] hover:from-[var(--deep-navy)] hover:via-[var(--accent-navy)] hover:to-[var(--deep-navy)] transition-all duration-500 drop-shadow-sm">
              Plan
            </span>
          </h2>
          
          {/* Single powerful student message with cream theme - enhanced spacing */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="backdrop-blur-lg rounded-2xl p-8 md:p-10 border-2 shadow-xl transition-all duration-300 relative overflow-hidden" style={{background: 'var(--rich-cream)', borderColor: 'var(--warm-beige)'}}>
              {/* Premium gold decoration */}
              <div className="absolute top-3 right-5 w-8 h-8 border-2 rounded-full opacity-50" style={{borderColor: 'var(--premium-gold)'}}></div>
              
              <div className="relative z-10">
                <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed">
                  <span className="font-bold" style={{color: 'var(--accent-navy)'}}>Start automating your assignments today.</span>
                  <br />
                  Free forever plan gets you started. Upgrade to Student for full automation power.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto mb-24 relative z-10">
          {/* Free Plan - PREMIUM CREAM-DOMINANT theme */}
          <div className="backdrop-blur-lg rounded-3xl p-10 border-2 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 relative overflow-hidden" style={{background: 'linear-gradient(135deg, var(--primary-cream) 0%, var(--rich-cream) 50%, var(--secondary-cream) 100%)', borderColor: 'var(--warm-beige)'}}>
            {/* Premium cream background elements */}
            <div className="absolute inset-0 opacity-60" style={{background: 'linear-gradient(to bottom right, var(--rich-cream) 0%, var(--primary-cream) 100%)'}}></div>
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full" style={{background: 'linear-gradient(135deg, var(--premium-gold), transparent)', opacity: '0.3'}}></div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-slate-800 mb-3">Free Forever</h3>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-gray-800 mb-3">$0</div>
                <p className="text-slate-600 text-lg">Perfect for getting started</p>
              </div>
            
              <ul className="space-y-5 mb-10">
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Unlimited task management</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Canvas calendar sync</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">5 document Q&A queries per day</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">Basic grade tracking</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[#9CAF88]/30 border border-[#9CAF88]/60 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 text-lg font-medium">File storage (up to 10 files)</span>
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

          {/* Student Plan - PREMIUM CREAM with luxurious gold and navy accents */}
          <div className="backdrop-blur-lg rounded-3xl p-10 border-4 relative shadow-3xl transform scale-105 hover:scale-110 transition-all duration-500 overflow-hidden" style={{background: 'linear-gradient(135deg, var(--rich-cream) 0%, var(--primary-cream) 40%, var(--secondary-cream) 80%, var(--tertiary-cream) 100%)', borderColor: 'var(--premium-gold)'}}>
            {/* Premium cream with gold highlight elements */}
            <div className="absolute inset-0 opacity-50" style={{background: 'linear-gradient(to bottom right, var(--premium-gold) 0%, var(--rich-cream) 50%, var(--primary-cream) 100%)', opacity: '0.15'}}></div>
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full" style={{background: 'linear-gradient(135deg, var(--premium-gold), transparent)', opacity: '0.3'}}></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full" style={{background: 'linear-gradient(to top left, var(--warm-gold), transparent)', opacity: '0.25'}}></div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-slate-800 mb-3">Student</h3>
                <div className="text-5xl font-black mb-2 drop-shadow-sm" style={{color: 'var(--accent-navy)'}}>
                  $4.99<span className="text-2xl">/month</span>
                </div>
                <div className="text-sm font-semibold rounded-full px-4 py-2 inline-block mb-3" style={{color: 'var(--premium-gold)', backgroundColor: 'var(--rich-cream)', border: '2px solid var(--premium-gold)'}}>
                  💰 Save 40% with annual: $36/year (only $3/month)
                </div>
                <p className="text-xl mb-2 font-semibold" style={{color: 'var(--accent-navy)'}}>🚀 Recommended for active students</p>
                <p className="font-medium" style={{color: 'var(--accent-navy)'}}>7-day free trial • Cancel anytime • 50+ queries per day</p>
              </div>
            
              <ul className="space-y-5 mb-10">
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-semibold">Everything in Free</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">50 document Q&A queries per day</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">Advanced study analytics</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">Unlimited syllabus AI extraction</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-3.5 h-3.5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-800 text-lg font-medium">Custom task types & colors</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-6 h-6 bg-[var(--primary-navy)]/40 border border-[var(--primary-navy)]/70 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
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
                className="w-full bg-gradient-to-r from-[var(--primary-navy)] to-[var(--primary-navy)] hover:from-[var(--primary-navy)] hover:to-[var(--primary-navy)] text-white font-bold py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                ariaLabel="Start Student plan free trial"
                dataTestId="student-plan-btn"
              />
            </div>
          </div>
        </div>


        <div className="text-center mt-16 relative z-10">
          <div className="flex items-center justify-center gap-6 text-lg font-medium" style={{color: 'var(--accent-navy)'}}>
            <span className="flex items-center px-4 py-2 rounded-full shadow-lg border-2" style={{backgroundColor: 'var(--rich-cream)', borderColor: 'var(--warm-beige)'}}>
              <svg className="w-5 h-5 mr-2" style={{color: 'var(--accent-sage)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              7-day free trial
            </span>
            <span className="flex items-center px-4 py-2 rounded-full shadow-lg border-2" style={{backgroundColor: 'var(--rich-cream)', borderColor: 'var(--warm-beige)'}}>
              <svg className="w-5 h-5 mr-2" style={{color: 'var(--accent-sage)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;