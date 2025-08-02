import React, { useState } from 'react';
import { getAppName } from '../utils/buildConfig';
import Button from './ui/Button';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0); // Default first FAQ open

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Analytics tracking function
  const trackEvent = (eventName: string, properties?: any) => {
    // Placeholder for analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
    console.log('Analytics Event:', eventName, properties);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded" tabIndex={0}>{getAppName()}</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <a 
                href="#features" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                onClick={() => trackEvent('nav_click', { section: 'features' })}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                onClick={() => trackEvent('nav_click', { section: 'pricing' })}
              >
                Pricing
              </a>
              <a 
                href="#about" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                onClick={() => trackEvent('nav_click', { section: 'about' })}
              >
                About
              </a>
              <a 
                href="#faq" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                onClick={() => trackEvent('nav_click', { section: 'faq' })}
              >
                FAQ
              </a>
              <Button
                text="Get Started"
                onClick={() => {
                  trackEvent('get_started_clicked', { location: 'nav' });
                  onGetStarted();
                }}
                ariaLabel="Start using ScheduleBud for free"
                dataTestId="nav-get-started-btn"
              />
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <Button
                text="Get Started"
                onClick={() => {
                  trackEvent('get_started_clicked', { location: 'mobile_nav' });
                  onGetStarted();
                }}
                size="sm"
                ariaLabel="Start using ScheduleBud for free"
                dataTestId="mobile-nav-get-started-btn"
              />
              <button
                onClick={toggleMobileMenu}
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-2"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <div className="flex flex-col space-y-2">
                <a 
                  href="#features" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
                  onClick={() => {
                    trackEvent('nav_click', { section: 'features', device: 'mobile' });
                    closeMobileMenu();
                  }}
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
                  onClick={() => {
                    trackEvent('nav_click', { section: 'pricing', device: 'mobile' });
                    closeMobileMenu();
                  }}
                >
                  Pricing
                </a>
                <a 
                  href="#about" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
                  onClick={() => {
                    trackEvent('nav_click', { section: 'about', device: 'mobile' });
                    closeMobileMenu();
                  }}
                >
                  About
                </a>
                <a 
                  href="#faq" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
                  onClick={() => {
                    trackEvent('nav_click', { section: 'faq', device: 'mobile' });
                    closeMobileMenu();
                  }}
                >
                  FAQ
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="absolute inset-0 bg-white/30"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6 border border-blue-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Built for students, by a student
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Stop Drowning in 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Deadlines</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                ScheduleBud was built to sync with Canvas, track your assignments, and help you build smarter study habits. Go from overwhelmed to on top of your work.
              </p>
              
              {/* Enhanced Benefit Bullets */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
                <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-green-100">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700">Save hours weekly</span>
                </div>
                <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700">Sync with Canvas</span>
                </div>
                <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-purple-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700">Free forever plan</span>
                </div>
              </div>
              
              {/* Enhanced CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                <Button
                  text="Try ScheduleBud for Free"
                  onClick={() => {
                    trackEvent('get_started_clicked', { location: 'hero' });
                    onGetStarted();
                  }}
                  size="lg"
                  ariaLabel="Start using ScheduleBud for free"
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  dataTestId="hero-get-started-btn"
                />
                <Button
                  text="See How It Works"
                  variant="outline"
                  size="lg"
                  href="#features"
                  ariaLabel="Learn about ScheduleBud features"
                  className="border-2 border-gray-300 hover:border-blue-300 bg-white/80 backdrop-blur-sm hover:bg-blue-50 transform hover:-translate-y-0.5 transition-all duration-200"
                  dataTestId="hero-demo-btn"
                />
              </div>
              <p className="text-sm text-gray-500 flex items-center justify-center lg:justify-start">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free forever plan available • No credit card required
              </p>
            </div>
            
            {/* Enhanced Hero Visual */}
            <div className="text-center lg:text-right">
              <div className="relative">
                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-200 rounded-lg rotate-12 opacity-80 shadow-lg"></div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-200 rounded-full opacity-80 shadow-lg animate-bounce"></div>
                <div className="absolute bottom-4 -left-2 w-8 h-8 bg-pink-200 rounded-lg -rotate-12 opacity-80 shadow-lg"></div>
                
                <div className="relative bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl p-8 shadow-2xl border border-white/50 backdrop-blur-sm">
                  <img 
                    src="/api/placeholder/600/400" 
                    alt="ScheduleBud app interface showing Canvas integration and task management" 
                    className="w-full h-80 object-cover rounded-xl shadow-lg border border-white/20"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl"></div>
                  <p className="text-sm text-gray-600 mt-6 italic font-medium">
                    ✨ See ScheduleBud in action - Canvas sync, AI assistance, and study analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Have you ever spent your Sunday nights copying Canvas assignments into a productivity app?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              I did too. That's why I built ScheduleBud - because I was tired of the endless
              cycle of manually managing my college assignments and academics with Notion.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 hover:shadow-lg transition-shadow rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Missing Assignments</h3>
              <p className="text-gray-600">
                Forgot an assignment buried in Canvas notifications? 
                Realized at midnight that something was due today?
              </p>
            </div>

            <div className="text-center p-8 hover:shadow-lg transition-shadow rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Manual Data Entry</h3>
              <p className="text-gray-600">
                Spent your weekend manually copying every assignment 
                and due date from Canvas into your planner?
              </p>
            </div>

            <div className="text-center p-8 hover:shadow-lg transition-shadow rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.239 0-4.236-.906-5.672-2.372M6.343 17.657l-.707.707A1 1 0 004.222 17.95l.707-.707m-.707-8.486l.707-.707a1 1 0 011.414 1.414l-.707.707m7.072 0l.707-.707a1 1 0 011.414 1.414l-.707.707m-.707 8.486l.707.707a1 1 0 01-1.414 1.414l-.707-.707M13 13.5V16a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scattered Information</h3>
              <p className="text-gray-600">
                Tasks in your planner, grades in Canvas, study sessions 
                in your head - nothing connects?
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-lg text-gray-700 font-medium">
              ScheduleBud fixes these problems with student-focused tools designed by someone who lives them too.
            </p>
          </div>
        </div>
      </section>

      {/* Early Adopter Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Become a Founding Member & Help Shape the Future of ScheduleBud
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ScheduleBud is brand new, and I'm looking for a handful of students to help me build the ultimate productivity tool. As an early adopter, you'll get direct access to me, your feedback will be prioritized, and you'll get the Student Plan free for a full year.
          </p>
          <Button
            text="Request Early Access"
            variant="primary"
            size="lg"
            href="#feedback-form"
            ariaLabel="Request early access to ScheduleBud"
            className="shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            dataTestId="early-access-btn"
          />
        </div>
      </section>

      {/* Solution Features */}
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
            {/* Canvas Integration - Priority Feature */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2">
              {/* Priority badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                MVP 🔥 
              </div>
              
              <div className="text-center mb-6">
                <div className="relative overflow-hidden rounded-xl">
                  <img 
                    src="/api/placeholder/300/150" 
                    alt="Canvas Auto-Import feature showing assignment synchronization" 
                    className="w-full h-36 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-xl"></div>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Never Manually Enter an Assignment Again</h3>
                  <span className="text-sm text-blue-600 font-medium">Canvas Integration</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Connect Canvas in seconds and watch all your due dates automatically populate your calendar. This feature alone saves me hours every month.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Automatic assignment import</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Due date synchronization</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Smart duplicate detection</span>
                </div>
              </div>
            </div>


            {/* Study Analytics - Priority Feature */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-2">
              <div className="text-center mb-6">
                <div className="relative overflow-hidden rounded-xl">
                  <img 
                    src="/api/placeholder/300/150" 
                    alt="Study Analytics dashboard showing performance insights and study patterns" 
                    className="w-full h-36 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent rounded-xl"></div>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">Study Analytics</h3>
                  <span className="text-sm text-green-600 font-medium">Performance Insights</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Track study patterns and see what actually works
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Study session tracking</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Performance insights</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Time allocation analysis</span>
                </div>
              </div>
            </div>

            {/* Grade Management */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-yellow-200 transform hover:-translate-y-2">
              <div className="text-center mb-6">
                <div className="relative overflow-hidden rounded-xl">
                  <img 
                    src="/api/placeholder/300/150" 
                    alt="Grade tracking dashboard with GPA calculation and performance trends" 
                    className="w-full h-36 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-600/20 to-transparent rounded-xl"></div>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors">Grade Tracking</h3>
                  <span className="text-sm text-yellow-600 font-medium">GPA & Performance</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Keep tabs on your GPA in real-time
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Real-time GPA calculation</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Grade category tracking</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Performance trends</span>
                </div>
              </div>
            </div>

            {/* Cross-Platform */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-2">
              <div className="text-center mb-6">
                <div className="relative overflow-hidden rounded-xl">
                  <img 
                    src="/api/placeholder/300/150" 
                    alt="Cross-platform compatibility showing web and desktop apps in sync" 
                    className="w-full h-36 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-transparent rounded-xl"></div>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">Works Everywhere</h3>
                  <span className="text-sm text-indigo-600 font-medium">Cross-Platform Sync</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Access your tasks from any device, anywhere
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Works on phone, tablet, laptop</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Real-time sync</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">No app downloads needed</span>
                </div>
              </div>
            </div>

            {/* File Management */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-red-200 transform hover:-translate-y-2">
              <div className="text-center mb-6">
                <div className="relative overflow-hidden rounded-xl">
                  <img 
                    src="/api/placeholder/300/150" 
                    alt="File organization system with syllabi and class materials" 
                    className="w-full h-36 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent rounded-xl"></div>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.239 0-4.236-.906-5.672-2.372M6.343 17.657l-.707.707A1 1 0 004.222 17.95l.707-.707m-.707-8.486l.707-.707a1 1 0 011.414 1.414l-.707.707m7.072 0l.707-.707a1 1 0 011.414 1.414l-.707.707m-.707 8.486l.707.707a1 1 0 01-1.414 1.414l-.707-.707" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">File Organization</h3>
                  <span className="text-sm text-red-600 font-medium">Document Management</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Upload syllabi and organize class files
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Syllabus management</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">File organization by class</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Quick access to materials</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Developer */}
      <section id="about" className="py-20 bg-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-indigo-100 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-6 border border-green-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Made with genuine student struggles
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            I Built ScheduleBud To Save Me Time and Energy
          </h2>
          
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 lg:p-12 mb-8 shadow-lg border border-gray-100">
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* Developer Photo */}
              <div className="text-center lg:text-left">
                <div className="relative inline-block">
                  <img 
                    src="/api/placeholder/150/150" 
                    alt="Photo of [Your Name], the student developer behind ScheduleBud" 
                    className="w-32 h-32 rounded-full mx-auto lg:mx-0 object-cover shadow-lg border-4 border-white"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 lg:mt-6">
                  <h3 className="text-xl font-bold text-gray-900">[Your Name]</h3>
                  <p className="text-blue-600 font-medium">Student Developer</p>
                  <div className="flex justify-center lg:justify-start space-x-2 mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">CS Student</span>
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Problem Solver</span>
                  </div>
                </div>
              </div>
              
              {/* Story Content */}
              <div className="lg:col-span-2 text-left">
                <div className="space-y-6">
                  <blockquote className="text-lg lg:text-xl text-gray-700 leading-relaxed font-medium italic border-l-4 border-blue-500 pl-6">
                    "I was constantly overwhelmed. My grades were slipping because I'd forget assignments buried in Canvas notifications."
                  </blockquote>
                  
                  <p className="text-gray-700 leading-relaxed">
                    I built the first version of ScheduleBud for myself, and the change was immediate: I stopped missing deadlines and had a clear view of my entire semester. Now, I'm opening it up to other students who are tired of the chaos.
                  </p>
                  
                  {/* Impact stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-blue-600">100%</div>
                      <div className="text-sm text-gray-600">Authentic Experience</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-600">Missed Deadlines</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center lg:col-span-1 col-span-2">
                      <div className="text-2xl font-bold text-purple-600">Hours</div>
                      <div className="text-sm text-gray-600">Saved Weekly</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-10 text-center">
              <Button
                text="Share Your Feedback"
                variant="primary"
                href="#feedback-form"
                ariaLabel="Share feedback about ScheduleBud"
                className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                dataTestId="feedback-cta-btn"
              />
              <p className="text-sm text-gray-500 mt-3">
                I read every message and prioritize based on real student needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Integration */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Your feedback shapes ScheduleBud
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              I read every message and prioritize features based on real student needs.
              Help me make ScheduleBud better by sharing your experiences.
            </p>
          </div>


          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Your Experience</h3>
              <p className="text-gray-600 text-sm">
                Tell me what's working, what's not, and what you wish existed
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapid Response</h3>
              <p className="text-gray-600 text-sm">
                Direct line from your feedback to implementation - no corporate committees, VCs, or shareholders
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M rocket" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real Features</h3>
              <p className="text-gray-600 text-sm">
                Your suggestions become real features that help students like you
              </p>
            </div>
          </div>

          {/* Feedback Form */}
          <div id="feedback-form" className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Send me your feedback</h3>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="your.email@university.edu"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">Your feedback</label>
                <textarea 
                  id="feedback" 
                  name="feedback" 
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical"
                  placeholder="What's working? What could be better? What features would help you most?"
                  required
                ></textarea>
              </div>
              <div className="text-center">
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
                  onClick={() => trackEvent('feedback_submitted', { source: 'landing_page' })}
                >
                  Send Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Simple, student-friendly pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* Free Plan */}
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Forever</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Basic task management</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Canvas calendar sync</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">5 AI queries per day</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Basic grade tracking</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Basic file storage</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Cross-platform sync</span>
                </li>
              </ul>

              <Button
                text="Start Free"
                onClick={onGetStarted}
                variant="secondary"
                className="w-full"
                ariaLabel="Start with ScheduleBud free plan"
                dataTestId="free-plan-btn"
              />
            </div>

            {/* Student Plan */}
            <div className="bg-blue-50 rounded-2xl p-8 border-4 border-blue-300 relative shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Student</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $5<span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-blue-600 font-medium">Unlock unlimited AI and Canvas features for just $5/month</p>
                <p className="text-sm text-blue-600 mt-2">Try Student free for 7 days</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Everything in Free</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">50 AI queries per day</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Advanced study analytics</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Email notifications</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Enhanced file storage (1GB)</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Custom task types & colors</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>

              <Button
                text="Try Student Free"
                variant="primary"
                className="w-full"
                ariaLabel="Start Student plan free trial"
                dataTestId="student-plan-btn"
              />
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Compare Plans</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-blue-600">Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 px-4 text-gray-700">Task Management</td>
                    <td className="text-center py-3 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </td>
                    <td className="text-center py-3 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">AI Queries per Day</td>
                    <td className="text-center py-3 px-4 text-gray-600">5</td>
                    <td className="text-center py-3 px-4 text-blue-600 font-medium">50</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">File Storage</td>
                    <td className="text-center py-3 px-4 text-gray-600">Basic</td>
                    <td className="text-center py-3 px-4 text-blue-600 font-medium">1GB</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">Email Notifications</td>
                    <td className="text-center py-3 px-4">
                      <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </td>
                    <td className="text-center py-3 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">Study Analytics</td>
                    <td className="text-center py-3 px-4 text-gray-600">Basic</td>
                    <td className="text-center py-3 px-4 text-blue-600 font-medium">Advanced</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">Priority Support</td>
                    <td className="text-center py-3 px-4">
                      <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </td>
                    <td className="text-center py-3 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-gray-500 mt-8">
            7-day free trial • Cancel anytime • Student discounts available
          </p>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            What's Coming Next
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Built for late-night study sessions and chaotic semesters. Here's what I'm working on next:
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Group Study Tools */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Group Study Tools</h3>
              <p className="text-gray-600 text-sm mb-3">
                Coordinate study sessions and share notes with classmates
              </p>
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                End of August, 2025
              </span>
            </div>
    
            
            {/* Smart Reminders */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Reminders</h3>
              <p className="text-gray-600 text-sm mb-3">
                AI-powered reminders based on your study patterns and deadlines
              </p>
              <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                Sometime in 2026
              </span>
            </div>
            
            {/* Voice Notes */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Notes & Tasks</h3>
              <p className="text-gray-600 text-sm mb-3">
                Create tasks and notes by voice while walking between classes
              </p>
              <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                Sometime in 2026
              </span>
            </div>
          </div>
          
          <div className="mt-12">
            <p className="text-gray-600 mb-6">
              Have ideas for features? Your feedback directly influences the roadmap.
            </p>
            <Button
              text="Share Your Ideas"
              variant="primary"
              href="#feedback-form"
              ariaLabel="Share feature ideas and feedback"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              dataTestId="roadmap-feedback-btn"
            />
          </div>
        </div>
      </section>

      {/* Social Proof & FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* FAQ */}
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
              {[
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
              ].map((faq, index) => (
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

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to boost your GPA with smarter study planning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join students who've ditched manual task management. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              text="Get Started Free"
              onClick={onGetStarted}
              variant="outline"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
              ariaLabel="Start using ScheduleBud for free"
              dataTestId="final-cta-btn"
            />
            <Button
              text="Watch Demo"
              variant="ghost"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600"
              href="#features"
              ariaLabel="Watch ScheduleBud demo video"
              dataTestId="demo-btn"
            />
          </div>
          <p className="text-blue-100 mt-6">
            Free forever • No credit card required • Built by a student, for students
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold mb-4">{getAppName()}</h3>
              <p className="text-gray-400 mb-6">Built for students, by a student</p>
              <div className="flex space-x-4">
                <a href="https://x.com/schedulebud" className="text-gray-400 hover:text-white transition-colors" aria-label="Follow ScheduleBud on X">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/schedulebud" className="text-gray-400 hover:text-white transition-colors" aria-label="Join ScheduleBud Discord">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <a href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</a>
                <a href="/terms" className="block hover:text-white transition-colors">Terms of Service</a>
                <a href="/contact" className="block hover:text-white transition-colors">Contact</a>
                <a href="#feedback-form" className="block hover:text-white transition-colors">Feedback</a>
                <a href="/help" className="block hover:text-white transition-colors">Help Center</a>
              </div>
            </div>
            
            {/* Community */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Join the Community</h4>
              <p className="text-gray-400 text-sm mb-4">
                Connect with other students and get help with ScheduleBud.
              </p>
              <a 
                href="https://discord.gg/schedulebud" 
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Join Discord
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 ScheduleBud. Made with ❤️ by a student who gets it.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;