import React from 'react';
import FeatureCard from './FeatureCard';

const LandingFeatures: React.FC = () => {
  const features = [
    {
      title: "Never Manually Enter an Assignment Again",
      subtitle: "Canvas Integration",
      description: "Connect Canvas in seconds and watch all your due dates automatically populate your calendar. This feature alone saves me hours every month.",
      features: [
        "Automatic assignment import",
        "Due date synchronization", 
        "Smart duplicate detection"
      ],
      imageAlt: "Canvas Auto-Import feature showing assignment synchronization",
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
      title: "Study Analytics",
      subtitle: "Performance Insights",
      description: "Track study patterns and see what actually works",
      features: [
        "Study session tracking",
        "Performance insights",
        "Time allocation analysis"
      ],
      imageAlt: "Study Analytics dashboard showing performance insights and study patterns",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      colorScheme: 'green' as const
    },
    {
      title: "Grade Tracking",
      subtitle: "GPA & Performance",
      description: "Keep tabs on your GPA in real-time",
      features: [
        "Real-time GPA calculation",
        "Grade category tracking",
        "Performance trends"
      ],
      imageAlt: "Grade tracking dashboard with GPA calculation and performance trends",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      colorScheme: 'yellow' as const
    },
    {
      title: "Works Everywhere",
      subtitle: "Cross-Platform Sync",
      description: "Access your tasks from any device, anywhere",
      features: [
        "Works on phone, tablet, laptop",
        "Real-time sync",
        "No app downloads needed"
      ],
      imageAlt: "Cross-platform compatibility showing web and desktop apps in sync",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      colorScheme: 'indigo' as const
    },
    {
      title: "File Organization",
      subtitle: "Document Management",
      description: "Upload syllabi and organize class files",
      features: [
        "Syllabus management",
        "File organization by class",
        "Quick access to materials"
      ],
      imageAlt: "File organization system with syllabi and class materials",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.239 0-4.236-.906-5.672-2.372M6.343 17.657l-.707.707A1 1 0 004.222 17.95l.707-.707m-.707-8.486l.707-.707a1 1 0 011.414 1.414l-.707.707m7.072 0l.707-.707a1 1 0 011.414 1.414l-.707.707m-.707 8.486l.707.707a1 1 0 01-1.414 1.414l-.707-.707" />
        </svg>
      ),
      colorScheme: 'red' as const
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6 border border-blue-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Real features that actually work
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            The Tools I Built to Stay Organized
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            As a college student, I understand the struggles of college because I've lived through them. These are the tools I built to make them more manageable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
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