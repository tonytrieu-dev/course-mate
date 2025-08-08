import React from 'react';
import { getAppName } from '../../utils/buildConfig';

const LandingFooter: React.FC = () => {
  return (
    <footer className="text-slate-800 py-12 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #ffffff 0%, rgba(37, 99, 235, 0.05) 50%, rgba(37, 99, 235, 0.1) 100%)', borderTop: '1px solid rgba(37, 99, 235, 0.2)'}}>
      {/* Research-backed blue-dominant elements */}
      <div className="absolute inset-0">
        {/* Multi-layer professional gradients */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(37, 99, 235, 0.08) 50%, rgba(37, 99, 235, 0.12) 100%)'}}></div>
        <div className="absolute inset-0" style={{background: 'linear-gradient(to top left, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.9) 100%)'}}></div>
        
        {/* Professional floating elements */}
        <div className="absolute top-10 right-10 w-48 h-48 rounded-full mix-blend-multiply filter blur-2xl opacity-60" style={{background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(156, 175, 136, 0.08))'}}></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-50" style={{background: 'linear-gradient(to top left, rgba(37, 99, 235, 0.12), rgba(255, 255, 255, 0.5))'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full mix-blend-multiply filter blur-lg opacity-40" style={{background: 'linear-gradient(to right, rgba(37, 99, 235, 0.1), rgba(156, 175, 136, 0.06))'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 transition-all duration-300" style={{color: 'var(--primary-navy)'}}>
              {getAppName()}
            </h3>
            <p className="text-slate-700 mb-6 max-w-md leading-relaxed font-medium backdrop-blur-sm rounded-2xl p-4" style={{backgroundColor: 'rgba(255, 248, 220, 0.6)', border: '1px solid rgba(37, 99, 235, 0.3)'}}>
              Stop wasting hours on boring setup work. 
              Focus on what actually matters: acing your classes.
            </p>
            <div>
              {/* Discord Community Button */}
              <div className="space-y-3">
                <a
                  href="https://discord.gg/schedulebud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 text-white rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110 font-bold backdrop-blur-sm" style={{backgroundColor: 'var(--primary-navy)', border: '1px solid rgba(37, 99, 235, 0.2)'}}
                  aria-label="Join ScheduleBud Discord community"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 2.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-2.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
                  </svg>
                  Join Discord
                </a>
                <p className="text-sm text-slate-600">
                  Connect with other students and get support!
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4" style={{color: 'var(--primary-navy)'}}>Quick Links</h4>
            <ul className="space-y-2 text-slate-700">
              <li>
                <a href="#features" className="hover:font-semibold font-medium transition-all duration-200 hover:underline" onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--primary-navy)'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#475569'}>
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:font-semibold font-medium transition-all duration-200 hover:underline" onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--primary-navy)'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#475569'}>
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:font-semibold font-medium transition-all duration-200 hover:underline" onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--primary-navy)'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#475569'}>
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-4" style={{color: 'var(--primary-navy)'}}>Support</h4>
            <ul className="space-y-2 text-slate-700">
              <li>
                <a href="/privacy-policy.html" className="hover:font-semibold font-medium transition-all duration-200 hover:underline" onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--primary-navy)'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#475569'}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-of-service.html" className="hover:font-semibold font-medium transition-all duration-200 hover:underline" onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--primary-navy)'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#475569'}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="mailto:tony@schedulebud.com" className="hover:font-semibold font-medium transition-all duration-200 hover:underline" onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--primary-navy)'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#475569'}>
                  Contact Me
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-8 pt-8 text-center" style={{borderTop: '1px solid rgba(37, 99, 235, 0.4)'}}>
          <p className="text-slate-600 font-medium backdrop-blur-sm rounded-xl p-4 inline-block" style={{backgroundColor: 'rgba(255, 248, 220, 0.5)', border: '1px solid rgba(37, 99, 235, 0.3)'}}>
            © {new Date().getFullYear()} {getAppName()}. Built with ❤️ for students, by a student.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;