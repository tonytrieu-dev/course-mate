import React from 'react';
import Button from '../ui/Button';
import LandingProductGallery from './LandingProductGallery';

interface LandingHeroProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted, trackEvent }) => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center" style={{background: 'linear-gradient(135deg, var(--secondary-cream) 0%, #ffffff 30%, rgba(37, 99, 235, 0.05) 100%)'}}>
      {/* Enhanced Study Focus background with navy blue + cream + sage green */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-32 left-32 w-96 h-96 rounded-full filter blur-3xl" style={{backgroundColor: 'rgba(156, 175, 136, 0.08)'}}></div>
        <div className="absolute top-20 right-40 w-64 h-64 rounded-full filter blur-3xl" style={{backgroundColor: 'rgba(37, 99, 235, 0.12)'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{backgroundColor: 'rgba(37, 99, 235, 0.06)'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left relative z-40">
            <div className="mb-8">
              <h1 className="font-black leading-tight tracking-tight">
                <div className="text-slate-900 text-4xl md:text-5xl lg:text-6xl mb-4">
                  Your Canvas Assignments.
                </div>
                <div className="text-4xl md:text-5xl lg:text-6xl mb-6 font-black" style={{color: 'var(--primary-navy)'}}>
                  IMPORTED AUTOMATICALLY
                </div>
                <div className="text-slate-800 text-xl md:text-2xl lg:text-3xl font-semibold">
                  Save 3+ hours every quarter. AI reads your syllabi instantly. More reliable than Canvas.
                </div>
              </h1>
            </div>
            
            <div className="mb-8">
              <div className="rounded-2xl p-6 shadow-xl" style={{backgroundColor: 'rgba(255, 248, 220, 0.95)', border: '1px solid rgba(156, 175, 136, 0.3)', backdropFilter: 'blur(4px)'}}>
                <div className="text-slate-800 font-bold mb-2">Built by a UCR student who actually uses it.</div>
                <div className="text-slate-700">
                  I built this because I was wasting <span className="font-semibold" style={{color: 'var(--premium-gold)'}}>3-4 hours every quarter</span> setting up my planner. Now I paste my Canvas link, upload my syllabi, and I'm <span className="font-semibold" style={{color: 'var(--accent-sage)'}}>done in 10 seconds</span>. 😎
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
                     background: 'linear-gradient(135deg, rgba(255, 248, 220, 0.95) 0%, rgba(255, 255, 255, 0.8) 30%, rgba(37, 99, 235, 0.08) 50%, rgba(37, 99, 235, 0.15) 100%)',
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