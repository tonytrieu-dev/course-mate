import React, { useState, useEffect, useRef } from 'react';

interface GallerySlide {
  id: string;
  title: string;
  description: string;
  type: 'screenshot' | 'video';
  placeholder: React.ReactNode;
  duration?: string;
}

interface LandingProductGalleryProps {
  className?: string;
}

const LandingProductGallery: React.FC<LandingProductGalleryProps> = ({ className = '' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gallery slides data
  const slides: GallerySlide[] = [
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      description: 'See all your tasks, upcoming deadlines, and study progress in one clean interface',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          {/* Mock Dashboard Header */}
          <div className="bg-white/90 rounded-xl p-4 shadow-lg border border-blue-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold text-slate-800">Today's Schedule</div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ On Track
              </div>
            </div>
            
            {/* Mock Task Items */}
            <div className="space-y-2">
              <div className="flex items-center bg-blue-50 rounded-lg p-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium block">CS 141 - Lab Report Due</span>
                  <span className="text-xs text-slate-500">Auto-synced from Canvas</span>
                </div>
              </div>
              <div className="flex items-center bg-green-50 rounded-lg p-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium block">MATH 120 - Problem Set 3</span>
                  <span className="text-xs text-slate-500">From AI syllabus upload</span>
                </div>
              </div>
              <div className="flex items-center bg-amber-50 rounded-lg p-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium block">Study Session - Midterm Prep</span>
                  <span className="text-xs text-slate-500">AI recommended timing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Study Progress */}
          <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg p-4 border border-green-200/50">
            <div className="text-center">
              <div className="text-xl font-bold text-green-800">📚 Study Progress</div>
              <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                <div className="bg-white/50 rounded p-2">
                  <div className="font-bold text-green-700">CS 141</div>
                  <div className="text-green-600 text-xs">Lab on track</div>
                </div>
                <div className="bg-white/50 rounded p-2">
                  <div className="font-bold text-green-700">MATH 120</div>
                  <div className="text-green-600 text-xs">Review ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'canvas-sync',
      title: 'Canvas Integration',
      description: 'Watch assignments auto-import from Canvas calendar with smart duplicate detection',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-white/90 rounded-xl p-4 shadow-lg border border-blue-200/50">
            <div className="text-lg font-bold text-slate-800 mb-3">Canvas Auto-Import</div>
            
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Importing Canvas Calendar...</span>
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-xs text-blue-600">calendar.instructure.com/feeds/...</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center bg-green-50 rounded-lg p-2">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-green-700">CS 141 - Project Milestone</span>
                </div>
                <div className="flex items-center bg-green-50 rounded-lg p-2">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-green-700">MATH 120 - Homework 8</span>
                </div>
                <div className="flex items-center bg-yellow-50 rounded-lg p-2">
                  <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-yellow-700">Duplicate detected - skipped</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-sm font-bold text-blue-800">12 assignments imported</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-syllabus',
      title: 'AI Syllabus Upload',
      description: 'Upload any PDF syllabus and watch AI extract all assignments, dates, and requirements',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-white/90 rounded-xl p-4 shadow-lg border border-amber-200/50">
            <div className="text-lg font-bold text-slate-800 mb-3">Smart Syllabus Processing</div>
            
            <div className="space-y-3">
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800">CS141-Syllabus-Fall2024.pdf</span>
                </div>
                <div className="text-xs text-amber-600 mb-2">Analyzing course schedule and requirements...</div>
                <div className="w-full bg-amber-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm font-bold text-green-800 mb-2">✨ AI Extracted Tasks:</div>
                <div className="space-y-1 text-xs">
                  <div className="text-green-700">• Project Proposal - Due Oct 15</div>
                  <div className="text-green-700">• Midterm Exam - Oct 28, 2:00 PM</div>
                  <div className="text-green-700">• Lab Report #3 - Due Nov 5</div>
                  <div className="text-green-700">• Final Project - Due Dec 10</div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <span className="text-sm font-bold text-blue-800">8 tasks created automatically</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'grade-analytics',
      title: 'Grade Analytics',
      description: 'Real-time GPA calculation with detailed breakdown by course and assignment category',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-white/90 rounded-xl p-4 shadow-lg border border-green-200/50">
            <div className="text-lg font-bold text-slate-800 mb-3">Grade Analytics Dashboard</div>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-green-800">3.67</div>
                <div className="text-sm text-green-700">Current GPA</div>
                <div className="text-xs text-green-600 mt-1">↗️ +0.12 this semester</div>
              </div>
              
              <div className="space-y-2">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-800">CS 141</span>
                    <span className="text-sm font-bold text-blue-800">92%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-green-800">MATH 120</span>
                    <span className="text-sm font-bold text-green-800">87%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{width: '87%'}}></div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-purple-800">PHYS 101</span>
                    <span className="text-sm font-bold text-purple-800">94%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'study-tracker',
      title: 'Study Session Tracking',
      description: 'Built-in timer with performance analytics and study pattern insights',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-white/90 rounded-xl p-4 shadow-lg border border-indigo-200/50">
            <div className="text-lg font-bold text-slate-800 mb-3">Study Session Tracker</div>
            
            <div className="space-y-3">
              <div className="bg-indigo-100 rounded-lg p-4 text-center">
                <div className="text-4xl font-black text-indigo-800 mb-1">25:00</div>
                <div className="text-sm text-indigo-700">Pomodoro Session</div>
                <div className="flex justify-center space-x-2 mt-2">
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1 rounded-full text-xs">
                    ⏸️ Pause
                  </button>
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded-full text-xs">
                    ⏹️ Stop
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-bold text-blue-800 mb-2">📊 Today's Stats</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-blue-700">3</div>
                    <div className="text-blue-600">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-700">2.5h</div>
                    <div className="text-blue-600">Focused</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between bg-green-50 rounded p-2">
                  <div className="text-xs text-green-700">CS 141 Study</div>
                  <div className="text-xs font-bold text-green-800">45 min</div>
                </div>
                <div className="flex items-center justify-between bg-blue-50 rounded p-2">
                  <div className="text-xs text-blue-700">MATH 120 Problems</div>
                  <div className="text-xs font-bold text-blue-800">30 min</div>
                </div>
                <div className="flex items-center justify-between bg-purple-50 rounded p-2">
                  <div className="text-xs text-purple-700">PHYS Reading</div>
                  <div className="text-xs font-bold text-purple-800">25 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'mobile-interface',
      title: 'Mobile Interface',
      description: 'Full mobile experience - add tasks, check grades, and track study sessions on the go',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-xs mx-auto">
          <div className="bg-slate-900 rounded-3xl p-2 shadow-2xl" style={{aspectRatio: '9/19.5'}}>
            <div className="bg-white rounded-2xl h-full overflow-hidden">
              {/* Phone header */}
              <div className="bg-blue-600 text-white p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">ScheduleBud</div>
                  <div className="text-xs">12:34 PM</div>
                </div>
              </div>
              
              {/* Phone content */}
              <div className="p-4 space-y-3 bg-blue-50 h-full">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-sm font-bold text-slate-800">📅 Today</div>
                  <div className="text-xs text-slate-600 mt-1">3 tasks due</div>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <div className="text-xs font-medium text-blue-800">CS 141 - Lab Due</div>
                    <div className="text-xs text-blue-600">Due in 2 hours</div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2">
                    <div className="text-xs font-medium text-green-800">Study Session</div>
                    <div className="text-xs text-green-600">Math review - 3:00 PM</div>
                  </div>
                  <div className="bg-amber-100 rounded-lg p-2">
                    <div className="text-xs font-medium text-amber-800">PHYS Quiz</div>
                    <div className="text-xs text-amber-600">Tomorrow 2:00 PM</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-sm font-bold text-slate-800">📊 GPA: 3.67</div>
                  <div className="text-xs text-green-600">↗️ +0.12 this semester</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-600">Swipe up for full interface</div>
        </div>
      )
    },
    {
      id: 'product-demo',
      title: 'Full Product Demo',
      description: 'Watch the complete ScheduleBud workflow in under 60 seconds',
      type: 'video',
      duration: '0:45',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl p-8 text-center">
            <div className="mb-4">
              <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div className="text-white text-xl font-bold mb-2">Complete Product Demo</div>
              <div className="text-blue-200 text-sm mb-4">See every feature in action</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="text-white text-sm">What you'll see:</div>
              <div className="text-blue-200 text-xs mt-2 space-y-1">
                <div>• Canvas sync in real-time</div>
                <div>• AI syllabus upload process</div>
                <div>• Grade analytics dashboard</div>
                <div>• Mobile interface walkthrough</div>
              </div>
            </div>
            
            <div className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Watch Full Demo
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-advance functionality
  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 6000); // 6 seconds per slide
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, slides.length]);

  // Pause auto-play on user interaction
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Touch/swipe handling
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextSlide();
    } else if (isRightSwipe) {
      goToPrevSlide();
    }
  };

  const goToNextSlide = () => {
    handleUserInteraction();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToPrevSlide = () => {
    handleUserInteraction();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    handleUserInteraction();
    setCurrentSlide(index);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevSlide();
    } else if (e.key === 'ArrowRight') {
      goToNextSlide();
    } else if (e.key >= '1' && e.key <= '7') {
      const slideIndex = parseInt(e.key) - 1;
      if (slideIndex < slides.length) {
        goToSlide(slideIndex);
      }
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`relative ${className}`}>
      {/* Main Gallery Container */}
      <div 
        className="relative bg-slate-900/95 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500" 
        style={{height: '450px'}}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Interactive product gallery"
      >
        {/* Browser-like Header */}
        <div className="absolute top-0 left-0 right-0 bg-slate-800/90 h-8 flex items-center px-4 z-20">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-4 text-xs text-slate-300 font-mono">
            schedulebud.com - {currentSlideData.title}
          </div>
        </div>

        {/* Gallery Content */}
        <div className="relative w-full h-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col justify-center items-center p-6 pt-12">
          
          {/* Slide Content */}
          <div className="relative z-10 w-full max-w-lg h-full flex flex-col justify-center">
            {currentSlideData.placeholder}
          </div>

          {/* Video Play Button Overlay (for video slides) */}
          {currentSlideData.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-all duration-300 z-20">
              <div className="bg-blue-600 hover:bg-blue-700 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl cursor-pointer transform hover:scale-110 transition-all duration-300">
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}

          {/* Screenshot/Video Badge */}
          <div className="absolute bottom-4 right-4 z-20">
            {currentSlideData.type === 'video' ? (
              <div className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-medium">
                ▶️ {currentSlideData.duration || '0:45'} Demo
              </div>
            ) : (
              <div className="bg-blue-600/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                📸 Screenshot Preview
              </div>
            )}
          </div>

          {/* Coming Soon Badge */}
          <div className="absolute top-12 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-20">
            🎬 REAL DEMO COMING
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-4 flex items-center z-30">
        <button
          onClick={goToPrevSlide}
          className="bg-white/80 hover:bg-white text-slate-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-y-0 right-4 flex items-center z-30">
        <button
          onClick={goToNextSlide}
          className="bg-white/80 hover:bg-white text-slate-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-3 z-50">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 border-2 shadow-md ${
              index === currentSlide
                ? 'bg-blue-500 border-blue-600 scale-110 shadow-blue-400/60'
                : 'bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:scale-105 shadow-slate-400/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Information */}
      <div className="mt-6 mb-6 text-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-6 border border-blue-200/50 shadow-xl max-w-lg mx-auto">
          <h4 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
            {currentSlideData.title}
          </h4>
          <p className="text-lg text-slate-700 mb-8 leading-relaxed font-medium">
            {currentSlideData.description}
          </p>
          
          {/* Progress Indicator - Moved back to bottom with more space */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/80 shadow-sm">
              {currentSlide + 1} of {slides.length}
            </span>
            {isAutoPlaying && (
              <div className="flex items-center space-x-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 shadow-sm">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-700">Auto-advancing</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingProductGallery;