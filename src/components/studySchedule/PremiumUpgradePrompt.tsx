import React from 'react';
import { isPersonalMode } from '../../utils/buildConfig';

const PremiumUpgradePrompt: React.FC = () => {
  // Don't show upgrade prompt in personal mode
  if (isPersonalMode()) {
    return null;
  }
  
  const premiumFeatures = [
    {
      icon: '🧠',
      title: 'AI-Powered Optimization',
      description: 'Advanced algorithms analyze your learning patterns for maximum retention'
    },
    {
      icon: '📊',
      title: 'Detailed Analytics',
      description: 'Track retention rates, study efficiency, and performance trends over time'
    },
    {
      icon: '🎯',
      title: 'Smart Recommendations',
      description: 'Get personalized study suggestions based on your progress and goals'
    },
    {
      icon: '📚',
      title: 'Unlimited Classes',
      description: 'Analyze and optimize schedules for all your classes simultaneously'
    },
    {
      icon: '🔄',
      title: 'Spaced Repetition',
      description: 'Scientifically-proven review scheduling for long-term retention'
    },
    {
      icon: '📋',
      title: 'Export Options',
      description: 'Export schedules to PDF, iCal, and other formats for easy access'
    }
  ];
  
  const handleUpgrade = () => {
    // In a real app, this would redirect to billing/subscription page
    window.open('https://your-app.com/pricing', '_blank');
  };
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 m-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Unlock Premium Study Optimization
        </h3>
        
        <p className="text-gray-600 mb-4">
          Get the most out of your study schedule with advanced AI-powered features
        </p>
        
        <div className="inline-flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
          🔥 Limited Time: 50% off first month
        </div>
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {premiumFeatures.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="text-2xl flex-shrink-0">{feature.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pricing */}
      <div className="text-center mb-6">
        <div className="bg-white rounded-lg border-2 border-purple-200 p-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">$3.99</span>
            <span className="text-sm text-gray-600">/month</span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
              50% OFF
            </span>
          </div>
          
          <div className="text-xs text-gray-500 line-through mb-1">
            Regular price: $7.99/month
          </div>
          
          <div className="text-xs text-gray-600">
            Cancel anytime • 7-day free trial
          </div>
        </div>
      </div>
      
      {/* CTA Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors duration-200 text-sm"
        >
          Start Free Trial
        </button>
        
        <button
          onClick={() => window.open('https://your-app.com/demo', '_blank')}
          className="w-full bg-white text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 text-sm"
        >
          View Demo
        </button>
      </div>
      
      {/* Trust Indicators */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure payments</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No commitment</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-4H9m9 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2z" />
            </svg>
            <span>Instant access</span>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-400">
          Join 10,000+ students already optimizing their study schedules
        </div>
      </div>
      
      {/* Student Testimonial */}
      <div className="mt-4 bg-white/50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
            <span className="text-xs text-gray-600">JS</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1 mb-1">
              <div className="flex text-yellow-400 text-xs">
                {'★'.repeat(5)}
              </div>
              <span className="text-xs text-gray-600 font-medium">Sarah M.</span>
            </div>
            <p className="text-xs text-gray-600 italic">
              "The AI scheduling boosted my GPA from 3.2 to 3.8 in one semester. 
              The spaced repetition feature is a game-changer!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgradePrompt;