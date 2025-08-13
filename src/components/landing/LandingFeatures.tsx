import React, { useState } from 'react';
import FeatureCard from './FeatureCard';

const LandingFeatures: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

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
            Canvas Sync is Just the <span style={{color: 'var(--primary-navy)'}}>Beginning</span>
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

        {/* "See ScheduleBud In Action" Section - High-Quality Screenshots */}
        <div className="mt-24 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-slate-900 leading-tight">
              See ScheduleBud In Action
            </h3>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
              Real screenshots from the actual app. See exactly what your academic workspace will look like.
            </p>
          </div>

          {/* High-Quality Screenshot Gallery */}
          <div className="space-y-16">
            {/* Calendar Views - Before & After */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Empty Calendar */}
              <div className="group">
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-[#FFF8DC]/40">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] rounded-full text-xs font-bold uppercase tracking-wide">
                        Before Setup
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">Empty Calendar</h4>
                    <p className="text-slate-600 text-sm">The dreaded blank start. Nothing planned, stress levels rising.</p>
                  </div>
                  
                  {/* Screenshot - Ultra Sharp Settings */}
                  <div className="relative bg-white cursor-pointer" onClick={() => handleImageClick('/images/calendar-empty.png')}>
                    <img 
                      src="/images/calendar-empty.png" 
                      alt="Empty ScheduleBud calendar showing blank month view before any setup or assignment import"
                      className="w-full h-auto block hover:opacity-90 transition-opacity"
                      style={{ 
                        imageRendering: 'crisp-edges',
                        objectFit: 'contain',
                        maxHeight: '600px'
                      } as React.CSSProperties}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Disclaimer Caption */}
                  <div className="p-4 text-center">
                    <p className="text-xs italic text-gray-500 leading-relaxed">
                      Browser zoomed out for demonstration purposes <span className="font-semibold">ONLY</span>. Actual UI size and experience remain exactly the same.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Calendar */}
              <div className="group">
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-[#9CAF88]/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="px-3 py-1.5 bg-[#9CAF88]/20 text-[#6B7F5A] rounded-full text-xs font-bold uppercase tracking-wide">
                        After 30 Seconds
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-[#9CAF88]/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#6B7F5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">Fully Organized</h4>
                    <p className="text-slate-600 text-sm">Every assignment, every deadline. Your entire quarter planned automatically.</p>
                  </div>
                  
                  {/* Screenshot - Ultra Sharp Settings */}
                  <div className="relative bg-white cursor-pointer" onClick={() => handleImageClick('/images/calendar-full.png')}>
                    <img 
                      src="/images/calendar-full.png" 
                      alt="ScheduleBud calendar filled with organized assignments and deadlines from multiple classes showing comprehensive academic schedule"
                      className="w-full h-auto block hover:opacity-90 transition-opacity"
                      style={{ 
                        imageRendering: 'crisp-edges',
                        objectFit: 'contain',
                        maxHeight: '600px'
                      } as React.CSSProperties}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Disclaimer Caption */}
                  <div className="p-4 text-center">
                    <p className="text-xs italic text-gray-500 leading-relaxed">
                      Browser zoomed out for demonstration purposes <span className="font-semibold">ONLY</span>. Actual UI size and experience remain exactly the same.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard View */}
            <div className="max-w-5xl mx-auto">
              <div className="group">
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-[#2563EB]/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="px-3 py-1.5 bg-[#2563EB]/15 text-[#2563EB] rounded-full text-xs font-bold uppercase tracking-wide">
                        Dashboard View
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">Academic Command Center</h4>
                    <p className="text-slate-600 text-sm">Overview stats, upcoming deadlines, and quick insights. Everything at a glance.</p>
                  </div>
                  
                  {/* Screenshot - Ultra Sharp Settings */}
                  <div className="relative bg-white cursor-pointer" onClick={() => handleImageClick('/images/dashboard-view.png')}>
                    <img 
                      src="/images/dashboard-view.png" 
                      alt="ScheduleBud dashboard view showing academic statistics, upcoming assignments, and class overview for comprehensive student management"
                      className="w-full h-auto block hover:opacity-90 transition-opacity"
                      style={{ 
                        imageRendering: 'crisp-edges',
                        objectFit: 'contain',
                        maxHeight: '700px'
                      } as React.CSSProperties}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Views - Uncompleted & Completed */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Uncompleted Tasks */}
              <div className="group">
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-[#2563EB]/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="px-3 py-1.5 bg-[#2563EB]/15 text-[#2563EB] rounded-full text-xs font-bold uppercase tracking-wide">
                        Task Management
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">Active Tasks</h4>
                    <p className="text-slate-600 text-sm">What needs to be done. Filter, sort, and manage your workload efficiently.</p>
                  </div>
                  
                  {/* Screenshot - Ultra Sharp Settings */}
                  <div className="relative bg-white cursor-pointer" onClick={() => handleImageClick('/images/tasks-view-uncompleted.png')}>
                    <img 
                      src="/images/tasks-view-uncompleted.png" 
                      alt="ScheduleBud tasks view showing uncompleted assignments with filtering, sorting, and task management features"
                      className="w-full h-auto block hover:opacity-90 transition-opacity"
                      style={{ 
                        imageRendering: 'crisp-edges',
                        objectFit: 'contain',
                        maxHeight: '550px'
                      } as React.CSSProperties}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="group">
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-[#9CAF88]/15">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="px-3 py-1.5 bg-[#9CAF88]/20 text-[#6B7F5A] rounded-full text-xs font-bold uppercase tracking-wide">
                        Accomplishments
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">Completed Tasks</h4>
                    <p className="text-slate-600 text-sm">Track your progress. See what you've accomplished and stay motivated.</p>
                  </div>
                  
                  {/* Screenshot - Ultra Sharp Settings */}
                  <div className="relative bg-white cursor-pointer" onClick={() => handleImageClick('/images/tasks-view-completed.png')}>
                    <img 
                      src="/images/tasks-view-completed.png" 
                      alt="ScheduleBud completed tasks view showing finished assignments and academic progress tracking with satisfaction ratings"
                      className="w-full h-auto block hover:opacity-90 transition-opacity"
                      style={{ 
                        imageRendering: 'crisp-edges',
                        objectFit: 'contain',
                        maxHeight: '550px'
                      } as React.CSSProperties}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal image */}
            <img
              src={selectedImage}
              alt="Expanded screenshot view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
              style={{ 
                imageRendering: 'crisp-edges'
              } as React.CSSProperties}
            />
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
              Press ESC or click outside to close
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LandingFeatures;