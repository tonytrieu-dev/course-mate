import React, { useState } from 'react';

const LandingFAQ: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0); // Default first FAQ open

  const faqData = [
    {
      question: "Is this just another planner app?",
      answer: "No, ScheduleBud is an app designed specifically for the chaos of college. It's built around the reality of Canvas integration and the need to connect your study habits directly to your grades which is something that generic planners don't do."
    },
    {
      question: "Why is it \"by a student\"?",
      answer: "Because big companies don't understand student workflows. They don't experience the daily frustration of manual academic busy work that steals hours from studying. I built this because I lived through these tedious tasks, and I'm committed to solving problems that real students face, not what a corporate team thinks we need."
    },
    {
      question: "What does it mean to be an early adopter?",
      answer: "It means you get to help build the tool you've always wanted. I read and respond to all feedback personally. Your suggestions will directly influence the roadmap, and you'll get a free year of the premium plan as a thank you for your help."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 relative overflow-hidden">
      {/* Light artistic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blue-50/60 to-indigo-100/40"></div>
        {/* Light floating elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-indigo-200/40 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-tl from-indigo-200/25 to-blue-200/35 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="faq">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-white to-blue-100 text-blue-800 mb-6 border-2 border-blue-400/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Honest answers from a real student
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">A Few Honest Questions</h2>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto font-medium">
              Real questions I get asked, with honest answers from the developer.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200/50 overflow-hidden hover:shadow-2xl hover:bg-white/98 transition-all duration-300">
                <button
                  className="w-full px-6 py-5 text-left focus:outline-none hover:bg-blue-50/50 transition-all duration-200"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  aria-expanded={openFaqIndex === index}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 pr-4">{faq.question}</h3>
                    <div className="flex-shrink-0">
                      <svg 
                        className={`w-5 h-5 text-blue-600 transform transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="px-6 pb-5">
                    <div className="border-t border-blue-100/50 pt-4">
                      <p className="text-slate-700 leading-relaxed font-medium">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-slate-600 text-sm">
              Have more questions? <a href="#feedback-form" className="text-blue-600 hover:text-blue-700 font-bold underline hover:no-underline transition-all duration-200">Ask me directly</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;