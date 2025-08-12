import React from 'react';
import Button from '../ui/Button';
import LandingProductGallery from './LandingProductGallery';

interface LandingHeroProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted, trackEvent }) => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center bg-gradient-to-br from-white via-[var(--primary-cream)]/40 to-[var(--primary-cream)]/60">
      {/* Clean, student-focused background with subtle cream warmth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full filter blur-3xl opacity-30" style={{backgroundColor: 'var(--primary-navy)'}}></div>
        <div className="absolute top-20 right-20 w-48 h-48 rounded-full filter blur-2xl opacity-20" style={{backgroundColor: 'var(--cta-orange)'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left relative z-40">
            <div className="mb-8">
              <h1 className="font-black leading-tight tracking-tight">
                <div className="text-slate-900 text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 leading-tight font-black">
                  Your Canvas Calendar.
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 font-black leading-tight" style={{color: 'var(--primary-navy)'}}>
                  Synced Automatically.
                </div>
                <div className="text-slate-800 text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed">
                  Eliminate the soul-crushing, 3-hour process of manually setting up your academic calendar every quarter.
                </div>
              </h1>
            </div>
            
            <div className="mb-8">
              <div className="rounded-2xl p-6 shadow-xl" style={{backgroundColor: 'var(--primary-cream)', border: '1px solid rgba(37, 99, 235, 0.2)', backdropFilter: 'blur(8px)'}}>
                <div className="text-slate-700">
                  I'm a UCR student who got tired of wasting <span className="font-semibold" style={{color: 'var(--premium-gold)'}}>3-4 hours on manual setup every quarter</span>. So I built this. Now, I sync my Canvas calendar, upload my syllabi, and have my entire quarter planned in <span className="font-semibold" style={{color: 'var(--accent-sage)'}}>under 30 seconds</span>. 😎
                </div>
              </div>
            </div>
            
            {/* Enhanced CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6 relative z-10">
              <Button
                text="Try ScheduleBud for Free"
                onClick={() => {
                  trackEvent('get_started_clicked', { location: 'hero' });
                  onGetStarted();
                }}
                variant="cta-orange"
                size="lg"
                ariaLabel="Start using ScheduleBud for free"
                className="transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg font-semibold"
                dataTestId="hero-get-started-btn"
              />
              <Button
                text="See Features"
                variant="outline"
                size="lg"
                href="#features"
                ariaLabel="Learn about ScheduleBud features"
                className="bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg font-semibold cursor-pointer"
                dataTestId="hero-demo-btn"
              />
            </div>
            
            <div className="text-center lg:text-left">
              <p className="text-sm text-gray-500 flex items-center justify-center lg:justify-start mb-2">
                <svg className="w-4 h-4 mr-2" style={{color: 'var(--accent-sage)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free forever plan available • No credit card required
              </p>
              <p className="text-sm font-semibold flex items-center justify-center lg:justify-start" style={{color: 'var(--cta-orange)'}}>
                <svg className="w-4 h-4 mr-2" style={{color: 'var(--cta-orange)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                7-day free trial • Cancel anytime • Upgrade as you grow
              </p>
            </div>

          </div>
          
          {/* Full-Height Product Demo Showcase */}
          <div className="text-center lg:text-right flex flex-col justify-center">
            <div className="relative">
              {/* Interactive Product Gallery - Enhanced Study Focus theme */}
              <div className="relative rounded-3xl p-1 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden" 
                   style={{
                     background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, var(--primary-cream) 30%, rgba(255, 248, 220, 0.8) 60%, rgba(37, 99, 235, 0.08) 100%)',
                     border: '1px solid rgba(37, 99, 235, 0.2)',
                     minHeight: '500px', 
                     maxWidth: '100%'
                   }}>
                <LandingProductGallery />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;