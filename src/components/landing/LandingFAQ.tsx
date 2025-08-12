import React, { useState } from 'react';

const LandingFAQ: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0); // Default first FAQ open

  const faqData = [
    {
      question: "Is this just another planner app?",
      answer: "No, other generic planners are digital notebooks. ScheduleBud is an automation engine for your academic life. It's built around two things that other planners don't have: a direct Canvas sync and an AI that actually reads your syllabi for you. It's designed to save you time, not just help you organize it."
    },
    {
      question: "Does it work with all universities?",
      answer: "ScheduleBud works with any university that uses Canvas LMS for calendar sync. Most major universities (UCR, UCSD, CSUs, etc.) use Canvas. If your school uses a different system, the AI syllabus upload still works perfectly."
    },
    {
      question: "How secure is my academic data?",
      answer: "Your data is encrypted and stored securely with industry-standard practices. I only access what's needed for the features to work - your Canvas assignments and uploaded files. I never share or sell your information, and you can delete everything anytime."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely. Cancel anytime, no questions asked. Your Free plan features continue working forever. If you cancel the Student plan, you simply go back to the Free tier - no data loss, no hassle."
    },
    {
      question: "What if my Canvas assignments change?",
      answer: "ScheduleBud syncs with your Canvas calendar when you refresh the connection. If your professor changes a due date or adds new assignments, you can re-sync your Canvas calendar feed to get the latest updates instantly. The sync is quick and handles duplicate detection automatically."
    },
    {
      question: "Why is it \"by a student\"?",
      answer: "Because big companies don't understand student workflows. They've never spent their Sunday manually copying Canvas deadlines when they should be studying. I built this because I lived through these problems daily. I solve what real students actually face, not what a corporate team thinks we need."
    },
    {
      question: "What does it mean to be an early adopter?",
      answer: "It means you get to help build the tool you've always wanted. I read and respond to all feedback personally. Your suggestions will directly influence the roadmap, and you'll get a free year of the premium plan as a thank you for your help."
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[var(--primary-cream)]/30 via-white to-[var(--primary-cream)]/20">
      {/* Clean, student-focused background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-48 h-48 rounded-full filter blur-2xl opacity-25" style={{backgroundColor: 'var(--accent-sage)'}}></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="faq">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">
              A Few <span style={{color: 'var(--primary-navy)'}}>Honest</span> Questions
            </h2>
            <div className="backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-2xl mx-auto" style={{backgroundColor: 'rgba(255, 248, 220, 0.9)', border: '1px solid rgba(37, 99, 235, 0.3)'}}>
              <p className="text-xl text-slate-700 font-medium">
                Blunt answers to what you're probably wondering, from me, the creator.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.01]" style={{backgroundColor: 'rgba(255, 248, 220, 0.98)', border: '1px solid rgba(156, 175, 136, 0.5)'} as React.CSSProperties}>
                <button
                  className="w-full px-6 py-5 text-left focus:outline-none transition-all duration-200"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  aria-expanded={openFaqIndex === index}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold pr-4" style={{color: 'var(--primary-navy)'}}>{faq.question}</h3>
                    <div className="flex-shrink-0">
                      <svg 
                        className={`w-5 h-5 transform transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} style={{color: 'var(--primary-navy)'}} 
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
                    <div className="border-t pt-4 rounded-b-xl -mx-6 px-6" style={{borderColor: 'rgba(156, 175, 136, 0.4)', backgroundColor: 'rgba(156, 175, 136, 0.05)'}}>
                      <p className="text-slate-700 leading-relaxed font-medium">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <div className="backdrop-blur-sm rounded-2xl p-4 shadow-lg inline-block" style={{backgroundColor: 'rgba(255, 248, 220, 0.9)', border: '1px solid rgba(37, 99, 235, 0.3)'}}>
              <p className="text-slate-700 text-sm font-medium">
                Have more questions? <a href="https://discord.gg/schedulebud" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:no-underline transition-all duration-200" style={{color: 'var(--primary-navy)'}}>Ask me on Discord</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;