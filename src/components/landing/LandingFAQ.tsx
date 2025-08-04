import React, { useState } from 'react';

const LandingFAQ: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0); // Default first FAQ open

  const faqData = [
    {
      question: "Is this just another planner app?",
      answer: "No. ScheduleBud is a system designed specifically for the chaos of college. It's built around the reality of Canvas integration and the need to connect your study habits directly to your grades, something generic planners don't do."
    },
    {
      question: "Why is it \"by a student\"?",
      answer: "Because big companies don't understand our workflow. They don't live with the Sunday-night dread of copying assignments. I built this because I live this reality, and I'm committed to solving problems that real students face, not what a corporate team thinks we need."
    },
    {
      question: "What does it mean to be an early adopter?",
      answer: "It means you get to help build the tool you've always wanted. I read and respond to all feedback personally. Your suggestions will directly influence the roadmap, and you'll get a free year of the premium plan as a thank you for your help."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="faq">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mb-6 border border-gray-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Honest answers from a real student
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">A Few Honest Questions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real questions I get asked, with real answers from someone who actually uses this stuff.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  className="w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  aria-expanded={openFaqIndex === index}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                    <div className="flex-shrink-0">
                      <svg 
                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} 
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
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Have more questions? <a href="#feedback-form" className="text-blue-600 hover:text-blue-700 font-medium">Ask me directly</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;