import React from 'react';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  imageAlt: string;
  imageSrc?: string;
  icon: React.ReactNode;
  colorScheme: 'navy' | 'orange' | 'sage' | 'yellow';
  priority?: boolean;
  priorityBadge?: string;
}

const colorClasses = {
  navy: {
    border: 'hover:border-[var(--primary-navy)]/70',
    icon: 'bg-gradient-to-br from-[var(--primary-navy)]/10 to-[var(--primary-navy)]/20',
    iconText: 'text-[var(--primary-navy)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--primary-navy)]',
    checkmark: 'bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30',
    gradient: 'from-[var(--primary-navy)]/10',
    cardBg: 'bg-gradient-to-br from-[var(--secondary-cream)]/98 to-[var(--primary-navy)]/5',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700'
  },
  orange: {
    border: 'hover:border-[var(--cta-orange)]/70',
    icon: 'bg-gradient-to-br from-[var(--cta-orange)]/10 to-[var(--cta-orange)]/20',
    iconText: 'text-[var(--cta-orange)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--cta-orange)]',
    checkmark: 'bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30',
    gradient: 'from-[var(--cta-orange)]/10',
    cardBg: 'bg-gradient-to-br from-[var(--secondary-cream)]/98 to-[var(--cta-orange)]/5',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700'
  },
  sage: {
    border: 'hover:border-[var(--accent-sage)]/70',
    icon: 'bg-gradient-to-br from-[var(--accent-sage)]/10 to-[var(--accent-sage)]/20',
    iconText: 'text-[var(--accent-sage)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--accent-sage)]',
    checkmark: 'bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30',
    gradient: 'from-[var(--accent-sage)]/10',
    cardBg: 'bg-gradient-to-br from-[var(--secondary-cream)]/98 to-[var(--accent-sage)]/5',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700'
  },
  yellow: {
    border: 'hover:border-[var(--premium-gold)]/70',
    icon: 'bg-gradient-to-br from-[var(--premium-gold)]/10 to-[var(--premium-gold)]/20',
    iconText: 'text-[var(--premium-gold)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--premium-gold)]',
    checkmark: 'bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30',
    gradient: 'from-[var(--premium-gold)]/10',
    cardBg: 'bg-gradient-to-br from-[var(--secondary-cream)]/98 to-[var(--premium-gold)]/5',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700'
  }
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  description,
  features,
  imageAlt,
  imageSrc = '/api/placeholder/300/150',
  icon,
  colorScheme,
  priority = false,
  priorityBadge
}) => {
  const colors = colorClasses[colorScheme];

  return (
    <div className={`group relative ${colors.cardBg} backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-700 border border-slate-200/60 ${colors.border} transform hover:-translate-y-2 hover:scale-105 overflow-hidden`}>
      
      {/* Subtle background gradient - no hover opacity change */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} to-transparent opacity-20 transition-opacity duration-700`}></div>
      
      <div className="relative z-10">
        {/* Enhanced icon section with artistic treatment */}
        <div className="flex items-center mb-8">
          <div className={`w-20 h-20 ${colors.icon} backdrop-blur-sm rounded-3xl flex items-center justify-center mr-6 flex-shrink-0 group-hover:shadow-2xl transition-all duration-500 shadow-xl border border-slate-200/40`}>
            <div className={`${colors.iconText} filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2 ${colors.title} transition-colors duration-300`}>
              {title}
            </h3>
            <span className={`text-base ${colors.subtitle} font-bold tracking-wide opacity-90`}>
              {subtitle}
            </span>
          </div>
        </div>
        
        {/* Enhanced description with artistic container */}
        <p className={`${colors.textSecondary} mb-6 leading-relaxed text-lg bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/30`}>
          {description}
        </p>
        
        {/* Feature list with artistic enhancement */}
        <div className="space-y-4" data-feature-list="true">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start group/feature" data-feature-item={index}>
              <div className={`w-6 h-6 ${colors.checkmark} rounded-lg flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/feature:scale-125 group-hover/feature:rotate-6 transition-all duration-300 shadow-lg transform rotate-1`}>
                {/* Handwritten-style checkmark */}
                <svg className="w-4 h-4 transform -rotate-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121L9.707 19.121z" />
                </svg>
              </div>
              <span 
                className={`font-semibold leading-relaxed ${colors.textSecondary} text-base flex-1 inline-block`}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Simplified Demo Placeholder - AFTER bullet points */}
        <div className="mt-6 bg-gradient-to-br from-slate-100/60 to-slate-200/40 rounded-xl overflow-hidden border border-slate-300/20 relative group">
          <div className="aspect-video flex items-center justify-center relative" 
               style={{background: 'linear-gradient(135deg, #F8F9FA 0%, #FFF8DC 50%, #F3F7F0 100%)'}}>
            
            {/* Clean Feature Icon */}
            <div className={`w-20 h-20 ${colors.icon} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}>
              <div className={`${colors.iconText}`}>
                {icon}
              </div>
            </div>
            
            {/* Simple Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-300">
              <div className="rounded-full w-16 h-16 flex items-center justify-center shadow-xl cursor-pointer transform hover:scale-110 transition-all duration-300"
                   style={{backgroundColor: '#2563EB'}}
                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F2744'}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}>
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            
            {/* Clean Demo Badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Demo Preview
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default FeatureCard;