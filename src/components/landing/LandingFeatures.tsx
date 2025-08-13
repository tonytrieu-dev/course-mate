import React from 'react';
import FeatureCard from './FeatureCard';

const LandingFeatures: React.FC = () => {
  const features = [
    {
      title: "The 30-Second Syllabus",
      subtitle: "The most reliable way to plan your entire quarter.",
      description: "Just drop in your syllabus. My AI reads everything, even messy, 20-page PDFs, and instantly creates your complete task list. It works when Canvas is out of date, making the syllabus your main source of truth.",
      features: [
        "✅ Instantly extract every assignment, quiz, and exam.",
        "✅ More accurate than waiting for professor updates on Canvas.", 
        "✅ Deciphers even the most confusing professor formatting."
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
      title: "The 10-Second Setup",
      subtitle: "Your entire Canvas calendar, perfectly synced.",
      description: "Stop wasting the first day of class manually copying deadlines. Just paste your Canvas calendar feed URL once, and your entire quarter is planned automatically.",
      features: [
        "✅ No official university integration needed, it just works.",
        "✅ Automatically detects and avoids duplicate assignments.",
        "✅ Syncs across all your devices."
      ],
      imageAlt: "Canvas calendar import showing automatic assignment parsing from ICS feeds",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      colorScheme: 'sage' as const
    },
    {
      title: "Smart Assistant",
      subtitle: "Ask your course materials anything.",
      description: "",
      features: [
        "✅ Instantly find the late policy buried on page 17 of the syllabus.",
        "✅ Ask for a list of all high-weight assignments for a specific class.",
        "✅ Stop scrubbing through lecture slides to find that one specific detail."
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
    <section id="features" className="py-24 bg-gradient-to-br from-[var(--primary-cream)]/20 via-white to-[var(--primary-cream)]/30 relative">
      {/* Clean background with subtle student-focused accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 right-32 w-48 h-48 rounded-full filter blur-2xl opacity-25" style={{backgroundColor: 'var(--accent-sage)'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight text-slate-900 leading-tight">
            Take Back Your <span style={{color: 'var(--primary-navy)'}}>Free Time</span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto font-medium leading-relaxed">
            I focused on the 3 features that'll save you the most time and nothing else.
          </p>
        </div>

        {/* Smart Syllabus - HERO FEATURE with unique UPLOAD layout */}
        <div className="mb-16 max-w-4xl mx-auto relative">
          {/* Enhanced hero feature prominence with warm cream glow */}
          <div className="absolute -inset-6 bg-gradient-to-r from-[var(--premium-gold)]/15 to-[var(--cta-orange)]/10 rounded-3xl blur-xl"></div>
          <FeatureCard
            key={0}
            title={features[0].title}
            subtitle={features[0].subtitle}
            description={features[0].description}
            features={features[0].features}
            imageAlt={features[0].imageAlt}
            icon={features[0].icon}
            colorScheme={features[0].colorScheme}
            layout="upload"
          />
        </div>
        
        {/* Supporting Features Grid - Each with UNIQUE layout */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Canvas Sync - COMPARISON layout */}
          <FeatureCard
            key={1}
            title={features[1].title}
            subtitle={features[1].subtitle}
            description={features[1].description}
            features={features[1].features}
            imageAlt={features[1].imageAlt}
            icon={features[1].icon}
            colorScheme={features[1].colorScheme}
            layout="comparison"
          />
          
          {/* Smart Assistant - CHAT layout */}
          <FeatureCard
            key={2}
            title={features[2].title}
            subtitle={features[2].subtitle}
            description={features[2].description}
            features={features[2].features}
            imageAlt={features[2].imageAlt}
            icon={features[2].icon}
            colorScheme={features[2].colorScheme}
            layout="chat"
          />
        </div>

        {/* "Manage It All" Section - Annotated Screenshots */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-slate-900 leading-tight">
              Manage It All
            </h3>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
              Everything you need to stay organized, all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Dashboard View Screenshot */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-xl font-bold text-slate-900 mb-2">See Your Week at a Glance.</h4>
                  <p className="text-slate-600">Your personalized dashboard with everything that matters.</p>
                </div>
                
                {/* Screenshot Placeholder */}
                <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  {/* TODO: Replace with final asset */}
                  <div className="text-center text-gray-500">
                    <div className="text-sm font-medium mb-2">Dashboard Screenshot</div>
                    <div className="text-xs text-gray-400">Placeholder for dashboard view image</div>
                  </div>
                  
                  {/* Annotation Labels */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Upcoming Tasks
                    </div>
                    <div className="w-0.5 h-8 bg-blue-600 ml-6 mt-1"></div>
                  </div>
                  
                  <div className="absolute bottom-16 right-4">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Overdue Items
                    </div>
                    <div className="w-0.5 h-8 bg-red-500 ml-6 mt-1"></div>
                  </div>
                  
                  <div className="absolute bottom-4 left-8">
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Performance by Class
                    </div>
                    <div className="w-0.5 h-8 bg-green-600 ml-6 mt-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Management View Screenshot */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-xl font-bold text-slate-900 mb-2">All Your Tasks, Perfectly Organized.</h4>
                  <p className="text-slate-600">Powerful tools to find, filter, and manage everything.</p>
                </div>
                
                {/* Screenshot Placeholder */}
                <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  {/* TODO: Replace with final asset */}
                  <div className="text-center text-gray-500">
                    <div className="text-sm font-medium mb-2">Task Management Screenshot</div>
                    <div className="text-xs text-gray-400">Placeholder for task view image</div>
                  </div>
                  
                  {/* Annotation Labels */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Smart Search
                    </div>
                    <div className="w-0.5 h-8 bg-purple-600 ml-6 mt-1"></div>
                  </div>
                  
                  <div className="absolute top-20 left-4">
                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Quick Filters
                    </div>
                    <div className="w-0.5 h-8 bg-indigo-600 ml-6 mt-1"></div>
                  </div>
                  
                  <div className="absolute bottom-4 right-8">
                    <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Bulk Actions (Select All)
                    </div>
                    <div className="w-0.5 h-8 bg-orange-600 ml-6 mt-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;