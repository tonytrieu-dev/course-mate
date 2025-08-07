import React from 'react';
import { getAppName } from '../../utils/buildConfig';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-slate-800 py-12 relative overflow-hidden border-t border-blue-200/50">
      {/* Light artistic elements */}
      <div className="absolute inset-0">
        {/* Multi-layer light gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blue-50/80 to-indigo-100/70"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-indigo-100/50 via-blue-100/60 to-white/80"></div>
        
        {/* Light floating orbs */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-gradient-to-br from-blue-200/40 to-indigo-300/50 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-tl from-indigo-200/35 to-blue-300/45 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-blue-300/30 to-indigo-200/40 rounded-full mix-blend-multiply filter blur-lg opacity-40"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300">
              {getAppName()}
            </h3>
            <p className="text-slate-700 mb-6 max-w-md leading-relaxed font-medium bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/40">
              Stop wasting hours on menial tasks. 
              Focus on what actually matters: learning.
            </p>
            <div>
              {/* Enhanced Discord Button */}
              <div className="space-y-3">
                <a
                  href="mailto:tony@schedulebud.com"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110 font-bold backdrop-blur-sm border border-blue-500/20"
                  aria-label="Contact ScheduleBud owner"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Me
                </a>
                <p className="text-sm text-slate-600">
                  Discord community coming soon for early adopters!
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-blue-700 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-700">
              <li>
                <a href="#features" className="hover:text-blue-600 hover:font-semibold font-medium transition-all duration-200 hover:underline">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-blue-600 hover:font-semibold font-medium transition-all duration-200 hover:underline">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-blue-600 hover:font-semibold font-medium transition-all duration-200 hover:underline">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-bold text-blue-700 mb-4">Support</h4>
            <ul className="space-y-2 text-slate-700">
              <li>
                <a href="/privacy-policy.html" className="hover:text-blue-600 hover:font-semibold font-medium transition-all duration-200 hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-of-service.html" className="hover:text-blue-600 hover:font-semibold font-medium transition-all duration-200 hover:underline">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="mailto:tony@schedulebud.com" className="hover:text-blue-600 hover:font-semibold font-medium transition-all duration-200 hover:underline">
                  Contact Me
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-blue-300/60 text-center">
          <p className="text-slate-600 font-medium bg-white/50 backdrop-blur-sm rounded-xl p-4 inline-block border border-blue-200/40">
            © {new Date().getFullYear()} {getAppName()}. Built with ❤️ for students, by a student.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;