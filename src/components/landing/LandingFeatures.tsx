import React from 'react';
import FeatureCard from './FeatureCard';

const LandingFeatures: React.FC = () => {
  const features = [
    {
      title: "Smart Syllabus Upload",
      subtitle: "PDF → Task List in 30 Seconds, Save 2+ Hours Per Class",
      description: "Drop PDF syllabus → AI reads everything → instant task list. Works even when professors forget to update Canvas. The syllabus is always accurate.",
      features: [
        "Turn any PDF into your task list instantly",
        "More reliable than Canvas updates", 
        "Works with messy professor formatting"
      ],
      imageAlt: "AI syllabus upload showing automatic task generation from PDF documents",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      colorScheme: 'orange' as const
    },
    {
      title: "Canvas Calendar Sync",
      subtitle: "Copy-Paste Your Canvas Link, Save 1+ Hour Per Quarter",
      description: "Canvas link → boom, everything's imported automatically. Perfect backup when professors actually keep Canvas updated.",
      features: [
        "Set up Canvas assignments in 10 seconds",
        "Works when professors update Canvas",
        "Cross-device sync included"
      ],
      imageAlt: "Canvas LMS integration showing automatic assignment synchronization",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      colorScheme: 'sage' as const
    },
    {
      title: "AI Class Chatbot",
      subtitle: "Ask Your Documents Anything, Stop Endlessly Searching",
      description: "\"When's the midterm?\" \"What's the late policy?\" Get instant answers from your course files instead of scrolling through your slides.",
      features: [
        "Chat with your syllabi and course docs",
        "Find policies and deadlines instantly",
        "No more searching through endless lecture slides"
      ],
      imageAlt: "AI document assistant providing answers based on uploaded course materials",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      colorScheme: 'sage' as const
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      {/* Research-backed blue-dominant background with subtle accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full filter blur-3xl" style={{backgroundColor: 'rgba(37, 99, 235, 0.08)'}}></div>
        <div className="absolute bottom-40 left-20 w-96 h-96 rounded-full filter blur-3xl" style={{backgroundColor: 'rgba(37, 99, 235, 0.12)'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 rounded-full filter blur-3xl" style={{backgroundColor: 'rgba(156, 175, 136, 0.06)'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">
            Three Features That Actually <span style={{color: 'var(--primary-navy)'}}>Matter</span>
          </h2>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto font-medium">
            Smart syllabus upload, Canvas sync, and AI chatbot. That's it. No feature bloat.
          </p>
        </div>

        {/* Smart Syllabus - HERO FEATURE (Larger) */}
        <div className="mb-16 max-w-4xl mx-auto relative">
          {/* Enhanced hero feature prominence with subtle glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[var(--cta-orange)]/10 to-[var(--cta-orange)]/5 rounded-3xl blur-xl"></div>
          <FeatureCard
            key={0}
            title={features[0].title}
            subtitle={features[0].subtitle}
            description={features[0].description}
            features={features[0].features}
            imageAlt={features[0].imageAlt}
            icon={features[0].icon}
            colorScheme={features[0].colorScheme}
          />
        </div>
        
        {/* Supporting Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.slice(1).map((feature, index) => (
            <FeatureCard
              key={index + 1}
              title={feature.title}
              subtitle={feature.subtitle}
              description={feature.description}
              features={feature.features}
              imageAlt={feature.imageAlt}
              icon={feature.icon}
              colorScheme={feature.colorScheme}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;