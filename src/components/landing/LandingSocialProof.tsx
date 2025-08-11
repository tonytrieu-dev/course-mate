import React from 'react';
import Button from '../ui/Button';

const LandingSocialProof: React.FC = () => {
  return (
    <>
      <section className="py-24 bg-gradient-to-br from-[var(--primary-cream)]/25 via-white to-[var(--primary-cream)]/15 relative">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
              <span style={{color: 'var(--cta-orange)'}}>Manual Setup</span> Wastes Your Quarter
            </h2>
            <div className="rounded-2xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto" style={{backgroundColor: 'rgba(255, 248, 220, 0.95)', border: '1px solid rgba(37, 99, 235, 0.3)'}}>
              <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
                Every quarter starts the same way: <span className="font-semibold text-slate-800">wasting 2-4 hours</span> setting up your planner instead of studying. Manually typing Canvas deadlines, scanning through 5 different PDFs for dates, and hunting through emails for assignment details.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" style={{backgroundColor: 'var(--secondary-cream)', border: '1px solid rgba(156, 175, 136, 0.3)'}}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'rgba(156, 175, 136, 0.2)'}}>
                <svg className="w-8 h-8" style={{color: 'var(--accent-sage)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3" style={{color: 'var(--primary-navy)'}}>Prof Changed the Date Again</h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Syllabus says one thing, Canvas says another, and the prof's email from last Tuesday contradicts both. So you submit early just to be safe and still get marked late because apparently there was a fourth date mentioned in class.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" style={{backgroundColor: 'var(--secondary-cream)', border: '1px solid rgba(156, 175, 136, 0.3)'}}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'rgba(156, 175, 136, 0.2)'}}>
                <svg className="w-8 h-8" style={{color: 'var(--accent-sage)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3" style={{color: 'var(--primary-navy)'}}>Sunday Night Regret</h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Spent three hours copying assignments from Canvas to my calendar. Found out Monday morning I missed the quiz that was only mentioned in a random PDF. Also somehow entered the same midterm date twice but for different classes.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" style={{backgroundColor: 'var(--secondary-cream)', border: '1px solid rgba(156, 175, 136, 0.3)'}}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'rgba(156, 175, 136, 0.2)'}}>
                <svg className="w-8 h-8" style={{color: 'var(--accent-sage)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3" style={{color: 'var(--primary-navy)'}}>Did I Submit That?</h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                It's 1 AM and I'm refreshing Canvas for the fifth time because I swear something's due tomorrow but can't remember what. The submission page looks different than usual. Did it actually go through? Why is there no confirmation email?
              </p>
            </div>
          </div>
          
        </div>
      </section>
    </>
  );
};

export default LandingSocialProof;