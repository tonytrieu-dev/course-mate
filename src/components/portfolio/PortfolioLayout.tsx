import React from 'react';
import { getAppName } from '../../utils/buildConfig';

interface PortfolioLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const PortfolioLayout: React.FC<PortfolioLayoutProps> = ({ children, title, description }) => {
  const handleBackToScheduleBud = () => {
    // Use hash routing to return to main landing page
    window.location.hash = '#/';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <button
                onClick={handleBackToScheduleBud}
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-3 py-2"
                aria-label="Return to ScheduleBud landing page"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to {getAppName()}
              </button>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      {/**
       * 
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} {getAppName()}. Built for students, by a student.
              </p>
              <div className="mt-4 flex justify-center space-x-6">
                <button
                  onClick={handleBackToScheduleBud}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  Try {getAppName()}
                </button>
                <a
                  href="https://github.com/tonytrieu-dev/schedule-bud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  View Code
                </a>
              </div>
            </div>
          </div>
          </footer>
        */}
    </div>
  );
};

export default PortfolioLayout;