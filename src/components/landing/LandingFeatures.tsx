import React from 'react';
import FeatureCard from './FeatureCard';

const LandingFeatures: React.FC = () => {
  const features = [
    {
      title: "Canvas Calendar Sync",
      subtitle: "Auto-Import Your Canvas Assignments",
      description: "Paste your Canvas link → boom, all assignments imported. No more copy-paste hell.",
      features: [
        "Automatic Canvas assignment import",
        "Smart duplicate detection",
        "Quarter & semester system support",
        "Works with any Canvas LMS"
      ],
      imageAlt: "Canvas LMS integration showing automatic assignment synchronization",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      colorScheme: 'blue' as const,
      //priority: true,
      //priorityBadge: "MVP 🔥"
    },
    {
      title: "Smart Syllabus Upload",
      subtitle: "AI-Powered Task Extraction",
      description: "Drop PDF syllabus → AI reads everything → instant task list. Even works with messy professor formatting.",
      features: [
        "PDF syllabus → automatic tasks",
        "AI-powered due date extraction",
        "Smart class assignment",
        "Multi-course syllabus support"
      ],
      imageAlt: "AI syllabus upload showing automatic task generation from PDF documents",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      colorScheme: 'blue' as const
    },
    {
      title: "Cross-Platform Sync",
      subtitle: "Access Anywhere, Anytime",
      description: "Phone, laptop, tablet → everything syncs instantly. Start studying anywhere, finish everywhere.",
      features: [
        "Works on phone, tablet, laptop",
        "Real-time cloud synchronization",
        "No app downloads needed",
        "Offline mode with smart sync"
      ],
      imageAlt: "Cross-platform synchronization across devices",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      colorScheme: 'blue' as const
    },
    {
      title: "Document Q&A Assistant",
      subtitle: "AI Chat About Your Course Materials",
      description: "Ask your documents anything. \"When's the midterm?\" \"What's the late policy?\" Get instant answers from your own course materials.",
      features: [
        "Search through uploaded documents",
        "Context-aware answers from your files",
        "Course policy & deadline lookups",
        "Assignment detail explanations"
      ],
      imageAlt: "AI document assistant providing answers based on uploaded course materials",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      colorScheme: 'blue' as const
    },
    {
      title: "Study Session Tracking",
      subtitle: "Performance Analytics",
      description: "Built-in study timer + effectiveness tracking. See what actually helps you learn better.",
      features: [
        "Built-in study timer",
        "Session effectiveness ratings",
        "Time allocation analytics",
        "Study pattern insights"
      ],
      imageAlt: "Study session tracking with timer and performance analytics",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      colorScheme: 'blue' as const
    },
    {
      title: "Advanced Grade Analytics",
      subtitle: "GPA Tracking & Insights",
      description: "Real-time GPA tracking as you add grades. Import from Canvas or add manually. Watch your GPA live.",
      features: [
        "Real-time GPA calculation",
        "Quarter & semester support",
        "Grade category breakdown",
        "Assignment import from Canvas"
      ],
      imageAlt: "Advanced grade analytics with GPA tracking and performance insights",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      colorScheme: 'blue' as const
    }
  ];

  return (
    <section id="features" className="py-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 relative overflow-hidden">
      {/* Student Study Space Artistic Background */}
      <div className="absolute inset-0">
        {/* Primary light layers with notebook texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/90 to-indigo-100/80"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-100/30 via-indigo-100/40 to-white/60"></div>
        
        {/* Subtle notebook paper texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, #3b82f6 30px)',
          backgroundSize: '100% 30px'
        }}></div>
        
        {/* Coffee cup rings and study session remnants */}
        <div className="absolute top-32 right-32 w-16 h-16 rounded-full border-2 border-amber-200/30 opacity-40 transform rotate-12"></div>
        <div className="absolute bottom-40 left-24 w-12 h-12 rounded-full border border-orange-200/25 opacity-35 transform -rotate-6"></div>
        <div className="absolute top-2/3 right-1/3 w-8 h-8 rounded-full border border-yellow-200/30 opacity-30"></div>
        
        {/* Study materials scattered around - floating orbs as textbooks/notebooks */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-200/60 to-indigo-300/50 rounded-2xl transform rotate-3 mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-tl from-indigo-200/50 to-blue-300/60 rounded-xl transform -rotate-6 mix-blend-multiply filter blur-2xl opacity-60"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-200/40 to-indigo-300/50 rounded-2xl transform rotate-12 mix-blend-multiply filter blur-xl opacity-50"></div>
        
        {/* Student workspace elements */}
        <div className="absolute inset-0 opacity-25">
          {/* Highlighter marks */}
          <div className="absolute top-1/4 right-1/3 w-24 h-3 bg-blue-300/60 transform rotate-45 rounded-full"></div>
          <div className="absolute bottom-1/3 left-1/4 w-18 h-2 bg-indigo-300/50 transform -rotate-12 rounded-full"></div>
          <div className="absolute top-2/3 right-1/4 w-20 h-2.5 bg-blue-400/40 transform rotate-12 rounded-full"></div>
          
          {/* Pencil/pen marks and dots */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-60 transform rotate-45"></div>
          <div className="absolute bottom-20 right-20 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-50"></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-4 bg-indigo-400 rounded-full transform -rotate-12 opacity-40"></div>
          
          {/* Post-it note shadows */}
          <div className="absolute top-16 left-1/3 w-16 h-16 bg-blue-200/20 transform rotate-6 rounded-sm shadow-sm"></div>
          <div className="absolute bottom-24 right-1/4 w-14 h-14 bg-indigo-200/15 transform -rotate-12 rounded-sm shadow-sm"></div>
          
          {/* Subtle grid pattern for engineering paper feel */}
          <div className="absolute inset-0 opacity-05">
            <div style={{
              backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} className="w-full h-full"></div>
          </div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 relative z-10">
          {/* Enhanced artistic title with automation emphasis */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 tracking-tight relative">
            <span className="text-slate-800 hover:text-slate-700 transition-colors duration-300">
              How ScheduleBud{' '}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 hover:from-blue-500 hover:via-indigo-600 hover:to-blue-700 transition-all duration-300">
              Eliminates Manual Work
            </span>
            {/* Artistic underline with handwritten feel */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-70 shadow-sm transform rotate-1"></div>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              subtitle={feature.subtitle}
              description={feature.description}
              features={feature.features}
              imageAlt={feature.imageAlt}
              icon={feature.icon}
              colorScheme={feature.colorScheme}
              //priority={feature.priority}
              //priorityBadge={feature.priorityBadge}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;