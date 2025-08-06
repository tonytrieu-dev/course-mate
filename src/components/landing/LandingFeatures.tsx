import React from 'react';
import FeatureCard from './FeatureCard';

const LandingFeatures: React.FC = () => {
  const features = [
    {
      title: "Canvas Assignment Sync",
      subtitle: "Auto-Import Your Canvas Tasks",
      description: "Paste your Canvas calendar link and watch your assignments appear automatically. No more Sunday night copy-paste sessions. It even handles duplicate assignments and weird formatting from professors.",
      features: [
        "Automatic Canvas assignment import",
        "Real-time sync with Canvas LMS", 
        "Smart duplicate detection",
        "Quarter & semester system support"
      ],
      imageAlt: "Canvas LMS integration showing automatic assignment synchronization",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      colorScheme: 'blue' as const,
      priority: true,
      priorityBadge: "MVP 🔥"
    },
    {
      title: "Smart Syllabus Upload",
      subtitle: "AI-Powered Task Extraction",
      description: "Drop in a syllabus PDF and the AI pulls out all the assignments, due dates, and exam info. Works even when professors format things weirdly. Powered by Google's Gemini AI.",
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
      description: "Your tasks, grades, and study data sync seamlessly across all devices. Real-time updates keep everything current wherever you are.",
      features: [
        "Works on phone, tablet, laptop",
        "Real-time cloud synchronization",
        "Instant data updates",
        "No app downloads needed"
      ],
      imageAlt: "Cross-platform synchronization across devices",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      colorScheme: 'teal' as const
    },
    {
      title: "Document Q&A Assistant",
      subtitle: "AI Chat About Your Course Materials",
      description: "Upload your syllabi and ask questions like 'When is the midterm?' or 'What's the late policy?' The AI searches through your documents and gives you real answers from your actual course materials.",
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
      colorScheme: 'green' as const
    },
    {
      title: "Study Session Tracking",
      subtitle: "Performance Analytics",
      description: "Track study sessions with built-in timer, effectiveness ratings, and insights into your study patterns.",
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
      colorScheme: 'teal' as const
    },
    {
      title: "Advanced Grade Analytics",
      subtitle: "GPA Tracking & Insights",
      description: "See your GPA update in real-time as you add grades. Import directly from Canvas or add them manually. Works with both semester and quarter systems.",
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
      colorScheme: 'green' as const
    }
  ];

  return (
    <section id="features" className="py-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Light artistic background for energetic visual impact */}
      <div className="absolute inset-0">
        {/* Primary light layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/90 to-indigo-100/80"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-100/30 via-blue-100/40 to-white/60"></div>
        
        {/* Dynamic floating orbs - light and airy */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-200/60 to-purple-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-tl from-indigo-200/50 to-blue-300/60 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-200/40 to-indigo-300/50 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
        
        {/* Artistic accent elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/3 w-2 h-32 bg-gradient-to-b from-blue-500 to-transparent rotate-45"></div>
          <div className="absolute bottom-1/3 left-1/4 w-2 h-24 bg-gradient-to-t from-indigo-500 to-transparent -rotate-12"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-20 bg-gradient-to-b from-purple-500 to-transparent rotate-12"></div>
          
          {/* Light floating particles */}
          <div className="absolute top-20 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-40"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-indigo-400 rounded-full opacity-50"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-30"></div>
          
          {/* Subtle grid pattern for tech feel */}
          <div className="absolute inset-0 opacity-10">
            <div style={{
              backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} className="w-full h-full"></div>
          </div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 relative z-10">
          {/* Light artistic badge */}
          <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-white to-blue-100 text-blue-800 mb-8 border-2 border-blue-400/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Built for real student problems
            </span>
          </div>
          
          {/* Light artistic title */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 tracking-tight relative">
            <span className="text-slate-800 hover:text-slate-700 transition-colors duration-300">
              Stop Wasting Time on{' '}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 transition-all duration-500 drop-shadow-sm">
              Busy Work
            </span>
            {/* Artistic underline */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-70 shadow-sm"></div>
          </h2>
          
          {/* Enhanced student story with light artistic container */}
          <div className="max-w-4xl mx-auto">
            <p className="text-xl md:text-2xl text-slate-700 leading-relaxed font-medium bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-blue-300/50 shadow-2xl hover:shadow-3xl hover:bg-white/95 transition-all duration-500">
              <span className="text-blue-700 font-bold">I'm a UCR computer engineering student</span> who got tired of the Sunday night assignment-copying ritual. 
              These features solve the problems I actually faced – Canvas sync that works, AI that helps, and analytics that matter.
            </p>
          </div>
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
              priority={feature.priority}
              priorityBadge={feature.priorityBadge}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;