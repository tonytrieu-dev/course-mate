import React, { useState } from 'react';
import { getAppName } from '../../utils/buildConfig';
import Button from '../ui/Button';

interface LandingNavigationProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingNavigation: React.FC<LandingNavigationProps> = ({ onGetStarted, trackEvent }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-white via-blue-50/80 to-indigo-50 shadow-lg backdrop-blur-sm sticky top-0 z-50 border-b border-blue-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded hover:scale-105 transition-transform duration-200" tabIndex={0}>
              {getAppName()}
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href="#features" 
              className="text-slate-700 hover:text-blue-600 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2 hover:bg-blue-50"
              onClick={() => trackEvent('nav_click', { section: 'features' })}
            >
              Features
            </a>
            <a 
              href="#pricing" 
              className="text-slate-700 hover:text-blue-600 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2 hover:bg-blue-50"
              onClick={() => trackEvent('nav_click', { section: 'pricing' })}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="text-slate-700 hover:text-blue-600 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2 hover:bg-blue-50"
              onClick={() => trackEvent('nav_click', { section: 'about' })}
            >
              About
            </a>
            <a 
              href="#faq" 
              className="text-slate-700 hover:text-blue-600 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2 hover:bg-blue-50"
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
              className="text-slate-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-2 hover:bg-blue-50 transition-all duration-200"
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
          <div className="md:hidden border-t border-blue-200/50 py-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex flex-col space-y-2">
              <a 
                href="#features" 
                className="text-slate-700 hover:text-blue-600 hover:bg-blue-100/50 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
                onClick={() => {
                  trackEvent('nav_click', { section: 'features', device: 'mobile' });
                  closeMobileMenu();
                }}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-slate-700 hover:text-blue-600 hover:bg-blue-100/50 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
                onClick={() => {
                  trackEvent('nav_click', { section: 'pricing', device: 'mobile' });
                  closeMobileMenu();
                }}
              >
                Pricing
              </a>
              <a 
                href="#faq" 
                className="text-slate-700 hover:text-blue-600 hover:bg-blue-100/50 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
                onClick={() => {
                  trackEvent('nav_click', { section: 'about', device: 'mobile' });
                  closeMobileMenu();
                }}
              >
                About
              </a>
              <a 
                href="#faq" 
                className="text-slate-700 hover:text-blue-600 hover:bg-blue-100/50 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
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
  );
};

export default LandingNavigation;