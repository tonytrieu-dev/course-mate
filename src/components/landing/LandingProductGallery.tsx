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

  // Gallery slides data - Big Three Features
  const slides: GallerySlide[] = [
    {
      id: 'canvas-sync',
      title: 'Canvas Integration',
      description: 'Copy-paste your Canvas link and watch assignments auto-import with smart duplicate detection',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-amber-50/90 rounded-xl p-4 shadow-lg border border-amber-200/50">
            <div className="text-lg font-bold text-navy-900 mb-3">Canvas Auto-Import</div>
            
            <div className="space-y-3">
              <div className="bg-navy-50 rounded-lg p-3 border-l-4 border-navy-600" style={{backgroundColor: '#f0f4f8', borderColor: '#2563EB'}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{color: '#2563EB'}}>Importing Canvas Calendar...</span>
                  <div className="w-4 h-4 rounded-full animate-pulse" style={{backgroundColor: '#2563EB'}}></div>
                </div>
                <div className="text-xs" style={{color: '#4A5568'}}>calendar.instructure.com/feeds/...</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center rounded-lg p-2" style={{backgroundColor: '#f0f4f0'}}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{color: '#9CAF88'}}>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs" style={{color: '#6B7F5A'}}>CS 141 - Project Milestone</span>
                </div>
                <div className="flex items-center rounded-lg p-2" style={{backgroundColor: '#f0f4f0'}}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{color: '#9CAF88'}}>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs" style={{color: '#6B7F5A'}}>MATH 120 - Homework 8</span>
                </div>
                <div className="flex items-center rounded-lg p-2" style={{backgroundColor: '#fef7ed'}}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{color: '#FF8C00'}}>
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs" style={{color: '#D97706'}}>Duplicate detected - skipped</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-sm font-bold" style={{color: '#2563EB'}}>12 assignments imported</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-syllabus',
      title: 'Smart Syllabus Upload',
      description: 'Upload any PDF syllabus and watch AI extract all assignments, dates, and requirements',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-amber-50/90 rounded-xl p-4 shadow-lg border border-amber-200/50" style={{backgroundColor: '#FFF8DC', borderColor: '#B8860B'}}>
            <div className="text-lg font-bold mb-3" style={{color: '#2563EB'}}>Smart Syllabus Processing</div>
            
            <div className="space-y-3">
              <div className="rounded-lg p-3 border" style={{backgroundColor: '#F5F1E8', borderColor: '#B8860B'}}>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#B8860B'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium" style={{color: '#996F0D'}}>CS141-Syllabus-Fall2024.pdf</span>
                </div>
                <div className="text-xs mb-2" style={{color: '#996F0D'}}>Analyzing course schedule and requirements...</div>
                <div className="w-full rounded-full h-2" style={{backgroundColor: '#E6D4A3'}}>
                  <div className="h-2 rounded-full" style={{backgroundColor: '#B8860B', width: '75%'}}></div>
                </div>
              </div>
              
              <div className="rounded-lg p-3" style={{backgroundColor: '#F3F7F0'}}>
                <div className="text-sm font-bold mb-2" style={{color: '#6B7F5A'}}>✨ AI Extracted Tasks:</div>
                <div className="space-y-1 text-xs">
                  <div style={{color: '#4A7C59'}}>• Project Proposal - Due Oct 15</div>
                  <div style={{color: '#4A7C59'}}>• Midterm Exam - Oct 28, 2:00 PM</div>
                  <div style={{color: '#4A7C59'}}>• Lab Report #3 - Due Nov 5</div>
                  <div style={{color: '#4A7C59'}}>• Final Project - Due Dec 10</div>
                </div>
              </div>
              
              <div className="rounded-lg p-2 text-center" style={{backgroundColor: '#f0f4f8'}}>
                <span className="text-sm font-bold" style={{color: '#2563EB'}}>8 tasks created automatically</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'smart-assistant',
      title: 'Smart Assistant',
      description: 'Chat with your course materials and get instant answers from uploaded syllabi and documents',
      type: 'screenshot',
      placeholder: (
        <div className="space-y-4 w-full max-w-md">
          <div className="bg-amber-50/90 rounded-xl p-4 shadow-lg border border-sage-200/50" style={{backgroundColor: '#FFF8DC', borderColor: '#9CAF88'}}>
            <div className="text-lg font-bold mb-3" style={{color: '#2563EB'}}>AI Course Assistant</div>
            
            <div className="space-y-3">
              <div className="rounded-lg p-3 border" style={{backgroundColor: '#F3F7F0', borderColor: '#9CAF88'}}>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor: '#2563EB'}}>
                    You
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg px-3 py-2 text-sm" style={{backgroundColor: '#e6f2ff', color: '#2563EB'}}>
                      What's the grading breakdown for CS 141?
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg p-3" style={{backgroundColor: '#f8f9fa'}}>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{backgroundColor: '#9CAF88'}}>
                    🤖
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg px-3 py-2 text-sm shadow-sm" style={{color: '#374151'}}>
                      Based on your CS 141 syllabus:
                      <br />• Labs: 40%
                      <br />• Midterm: 25% 
                      <br />• Final Project: 35%
                      <br /><span className="text-xs italic" style={{color: '#9CAF88'}}>Found in: CS141-Syllabus-Fall2024.pdf</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg p-3" style={{backgroundColor: '#f0f4f8'}}>
                <div className="text-sm font-bold mb-2" style={{color: '#2563EB'}}>📚 Available Documents:</div>
                <div className="space-y-1 text-xs">
                  <div style={{color: '#4A5568'}}>• CS141-Syllabus-Fall2024.pdf ✅</div>
                  <div style={{color: '#4A5568'}}>• MATH120-CourseInfo.pdf ✅</div>
                  <div style={{color: '#4A5568'}}>• PHYS101-StudyGuide.pdf ✅</div>
                </div>
              </div>
              
              <div className="rounded-lg p-2 text-center" style={{backgroundColor: 'linear-gradient(to right, #F3F7F0, #f0f4f8)'}}>
                <span className="text-sm font-bold" style={{color: '#6B7F5A'}}>💬 Try: "@CS141 when is the final?"</span>
              </div>
            </div>
          </div>
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
          <div className="rounded-xl p-8 text-center" style={{background: 'linear-gradient(135deg, #2563EB 0%, #2D4A6B 100%)'}}>
            <div className="mb-4">
              <div className="rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'rgba(255, 248, 220, 0.2)'}}>
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" style={{color: '#FFF8DC'}}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div className="text-xl font-bold mb-2" style={{color: '#FFF8DC'}}>Complete Product Demo</div>
              <div className="text-sm mb-4" style={{color: '#C7D7E8'}}>See all 3 features in action</div>
            </div>
            
            <div className="rounded-lg p-4 mb-4" style={{backgroundColor: 'rgba(255, 248, 220, 0.1)'}}>
              <div className="text-sm" style={{color: '#FFF8DC'}}>What you'll see:</div>
              <div className="text-xs mt-2 space-y-1" style={{color: '#C7D7E8'}}>
                <div>• Canvas sync in real-time</div>
                <div>• AI syllabus upload process</div>
                <div>• Smart Assistant Q&A demo</div>
                <div>• Mobile interface walkthrough</div>
              </div>
            </div>
            
            <div className="px-6 py-2 rounded-full text-sm font-medium inline-flex items-center transition-colors duration-200" 
                 style={{backgroundColor: '#FF8C00', color: '#FFF8DC'}}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF7F00'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}>
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
        className="relative bg-slate-900/95 rounded-2xl focus:outline-none focus:ring-2 border border-slate-700/30 overflow-hidden shadow-2xl"
        style={{height: '450px', '--tw-ring-color': '#2563EB'} as React.CSSProperties}
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
        <div className="relative w-full h-full flex flex-col justify-center items-center p-6 pt-12 pb-20" 
             style={{background: 'linear-gradient(135deg, #F8F9FA 0%, #FFF8DC 50%, #F3F7F0 100%)'}}>
          
          {/* Slide Content */}
          <div className="relative z-10 w-full max-w-lg flex flex-col justify-center items-center min-h-0">
            {currentSlideData.placeholder}
          </div>

          {/* Video Play Button Overlay (for video slides) */}
          {currentSlideData.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-all duration-300 z-20">
              <div className="rounded-full w-24 h-24 flex items-center justify-center shadow-2xl cursor-pointer transform hover:scale-110 transition-all duration-300"
                 style={{backgroundColor: '#2563EB'}}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F2744'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}>
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
              <div className="text-white px-3 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'rgba(37, 99, 235, 0.9)'}}>
                📸 Screenshot Preview
              </div>
            )}
          </div>

          {/* Enhanced Live Preview Badge */}
          <div className="absolute top-12 left-4 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-20 animate-pulse hover:animate-none transition-all duration-300 group cursor-pointer"
               style={{background: 'linear-gradient(135deg, #2563EB 0%, #2D4A6B 100%)'}}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#9CAF88'}}></div>
              <span>🎬 LIVE PREVIEW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Controls */}
      <div className="absolute inset-y-0 left-2 flex items-center z-30">
        <button
          onClick={goToPrevSlide}
          className="bg-white/80 hover:bg-white text-slate-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm transform hover:scale-110 active:scale-95 group"
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-y-0 right-2 flex items-center z-30">
        <button
          onClick={goToNextSlide}
          className="bg-white/80 hover:bg-white text-slate-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm transform hover:scale-110 active:scale-95 group"
          aria-label="Next slide"
        >
          <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-50 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 border-2 shadow-md ${
              index === currentSlide
                ? 'scale-110'
                : 'bg-white hover:bg-slate-50 hover:scale-105 shadow-slate-400/40'
            }`}
            style={{
              backgroundColor: index === currentSlide ? '#2563EB' : 'white',
              borderColor: index === currentSlide ? '#2563EB' : '#CBD5E1',
              boxShadow: index === currentSlide ? '0 4px 14px rgba(37, 99, 235, 0.6)' : '0 4px 6px rgba(148, 163, 184, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (index !== currentSlide) {
                e.currentTarget.style.borderColor = '#94A3B8';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentSlide) {
                e.currentTarget.style.borderColor = '#CBD5E1';
              }
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Information */}
      <div className="mt-6 mb-6 text-center">
        <div className="backdrop-blur-sm rounded-2xl px-8 py-6 border shadow-xl max-w-lg mx-auto" 
             style={{backgroundColor: 'rgba(255, 248, 220, 0.95)', borderColor: 'rgba(184, 134, 11, 0.5)'}}>
          <h4 className="text-xl font-bold mb-2 tracking-tight" style={{color: '#2563EB'}}>
            {currentSlideData.title}
          </h4>
          <p className="text-lg mb-8 leading-relaxed font-medium" style={{color: '#4A5568'}}>
            {currentSlideData.description}
          </p>
          
          {/* Progress Indicator - Moved back to bottom with more space */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm font-semibold px-3 py-1 rounded-full border shadow-sm" 
                  style={{color: '#4A5568', backgroundColor: '#F3F7F0', borderColor: 'rgba(156, 175, 136, 0.8)'}}>
              {currentSlide + 1} of {slides.length}
            </span>
            {isAutoPlaying && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full border shadow-sm" 
                   style={{backgroundColor: 'rgba(255, 248, 220, 0.8)', borderColor: 'rgba(184, 134, 11, 0.8)'}}>
                <div className="w-1 h-1 rounded-full animate-pulse" style={{backgroundColor: '#B8860B'}}></div>
                <span className="text-xs font-semibold" style={{color: '#996F0D'}}>Auto-advancing</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingProductGallery;