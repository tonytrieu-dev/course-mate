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
                You know the drill: spending the first week of every quarter manually typing deadlines from Canvas, hunting through 5 different syllabi, and trying to remember what your professor said in that one email.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 max-w-4xl mx-auto">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3" style={{color: 'var(--primary-navy)'}}>The Post-it Note Graveyard</h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Your Canvas has been synced perfectly. But you're still juggling Post-it notes for the weekly reading, a reminder on your phone for the study group, and a vague memory of a presentation the prof only mentioned in lecture. Your "single source of truth" is actually just three different apps and a pile of paper.
              </p>
            </div>
          </div>
          
        </div>
      </section>
    </>
  );
};

export default LandingSocialProof;