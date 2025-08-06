import React from 'react';
import Button from '../ui/Button';

const LandingSocialProof: React.FC = () => {
  return (
    <>
      {/* Problem Statement - Light Artistic Theme */}
      <section className="py-32 bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100 relative overflow-hidden">
        {/* Light artistic background elements */}
        <div className="absolute inset-0">
          {/* Multi-layer light gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-100/70"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-indigo-100/50 via-blue-100/60 to-white/80"></div>
          
          {/* Light dynamic floating orbs */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-200/50 to-indigo-300/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="absolute bottom-32 right-16 w-80 h-80 bg-gradient-to-tl from-indigo-200/45 to-purple-300/55 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-blue-300/40 to-cyan-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
          
          {/* Light artistic accent elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 right-1/4 w-2 h-40 bg-gradient-to-b from-blue-500 to-transparent rotate-45"></div>
            <div className="absolute bottom-1/3 left-1/4 w-2 h-32 bg-gradient-to-t from-indigo-500 to-transparent -rotate-12"></div>
            <div className="absolute top-2/3 right-1/3 w-1 h-24 bg-gradient-to-b from-purple-500 to-transparent rotate-12"></div>
            
            {/* Light floating particles */}
            <div className="absolute top-32 left-32 w-3 h-3 bg-blue-400 rounded-full opacity-50"></div>
            <div className="absolute bottom-32 right-32 w-2 h-2 bg-indigo-400 rounded-full opacity-60"></div>
            <div className="absolute top-3/4 right-1/5 w-2 h-2 bg-purple-400 rounded-full opacity-40"></div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 mb-8 leading-tight tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-orange-500">
                Sunday Night Assignment Copy-Paste Sessions
              </span>{' '}
              <span className="text-slate-800">Are The Worst</span>
            </h2>
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-blue-300/50 shadow-3xl hover:shadow-4xl transition-all duration-500 max-w-4xl mx-auto relative overflow-hidden">
              {/* Inner artistic elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-200/30 opacity-60"></div>
              <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 bg-gradient-to-tl from-indigo-200/40 to-transparent rounded-full"></div>
              
              <p className="text-xl md:text-2xl text-slate-700 leading-relaxed font-medium relative z-10">
                I spent way too many Sunday nights copying assignments from Canvas into Notion, trying to stay organized. It sucked. So I built ScheduleBud to automate all of that tedious work.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Missing Assignments Card */}
            <div className="text-center p-8 bg-white/90 backdrop-blur-lg rounded-3xl border border-red-200/50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
              {/* Card artistic elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-orange-200/30 opacity-50"></div>
              <div className="absolute top-2 right-2 w-10 h-10 bg-gradient-to-br from-red-200/30 to-transparent rounded-full"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100/80 to-red-200/90 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border border-red-300/60">
                  <svg className="w-8 h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Missing Assignments</h3>
                <p className="text-slate-700 leading-relaxed font-medium">
                  Got that 2 AM panic when you remember something was due today? 
                  Canvas notifications are a mess and easy to miss.
                </p>
              </div>
            </div>

            {/* Manual Data Entry Card */}
            <div className="text-center p-8 bg-white/90 backdrop-blur-lg rounded-3xl border border-blue-200/50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
              {/* Card artistic elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-200/30 opacity-50"></div>
              <div className="absolute top-2 right-2 w-10 h-10 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100/80 to-blue-200/90 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border border-blue-300/60">
                  <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Manual Data Entry</h3>
                <p className="text-slate-700 leading-relaxed font-medium">
                  Wasted your Sunday copying assignments one by one from Canvas? 
                  It's mind-numbing and there has to be a better way.
                </p>
              </div>
            </div>

            {/* Scattered Information Card */}
            <div className="text-center p-8 bg-white/90 backdrop-blur-lg rounded-3xl border border-purple-200/50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
              {/* Card artistic elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-indigo-200/30 opacity-50"></div>
              <div className="absolute top-2 right-2 w-10 h-10 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100/80 to-purple-200/90 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border border-purple-300/60">
                  <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.239 0-4.236-.906-5.672-2.372M6.343 17.657l-.707.707A1 1 0 004.222 17.95l.707-.707m-.707-8.486l.707-.707a1 1 0 011.414 1.414l-.707.707m7.072 0l.707-.707a1 1 0 011.414 1.414l-.707.707m-.707 8.486l.707.707a1 1 0 01-1.414 1.414l-.707-.707M13 13.5V16a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Scattered Information</h3>
                <p className="text-slate-700 leading-relaxed font-medium">
                  Tasks scattered across apps, grades stuck in Canvas, 
                  syllabi buried in PDFs. Nothing talks to each other.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-blue-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 max-w-4xl mx-auto relative overflow-hidden">
              {/* Inner artistic elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-200/30 opacity-60"></div>
              <div className="absolute top-2 right-2 w-10 h-10 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 bg-gradient-to-tl from-indigo-200/40 to-transparent rounded-full"></div>
              
              <p className="text-lg text-slate-700 font-semibold relative z-10 leading-relaxed">
                ScheduleBud connects all the dots: automatic Canvas sync, AI that reads your syllabi, 
                grade tracking, and study analytics.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold">
                  Everything in one place, like it should be.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Transition element to Features */}
      <div className="h-8 bg-gradient-to-b from-indigo-100/50 to-blue-50/50"></div>

    </>
  );
};

export default LandingSocialProof;