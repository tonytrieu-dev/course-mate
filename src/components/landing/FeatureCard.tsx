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
  layout?: 'upload' | 'comparison' | 'chat' | 'default';
}

// ROYAL BLUE DOMINANT WITH PREMIUM CREAM ACCENTS
const colorClasses = {
  navy: {
    border: 'hover:border-[var(--primary-navy)]/70',
    icon: 'bg-gradient-to-br from-[var(--primary-navy)]/15 to-[var(--primary-navy)]/25',
    iconText: 'text-[var(--primary-navy)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--primary-navy)]',
    checkmark: 'bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/40',
    gradient: 'from-[var(--primary-navy)]/12',
    cardBg: 'bg-gradient-to-br from-white to-[var(--primary-cream)]/60',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700',
    accent: 'var(--primary-navy)'
  },
  orange: {
    border: 'hover:border-[var(--cta-orange)]/70',
    icon: 'bg-gradient-to-br from-[var(--cta-orange)]/15 to-[var(--cta-orange)]/25',
    iconText: 'text-[var(--cta-orange)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--cta-orange)]',
    checkmark: 'bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/40',
    gradient: 'from-[var(--cta-orange)]/12',
    cardBg: 'bg-gradient-to-br from-white to-[var(--primary-cream)]/80',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700',
    accent: 'var(--cta-orange)'
  },
  sage: {
    border: 'hover:border-[var(--accent-sage)]/70',
    icon: 'bg-gradient-to-br from-[var(--accent-sage)]/15 to-[var(--accent-sage)]/25',
    iconText: 'text-[var(--accent-sage)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--accent-sage)]',
    checkmark: 'bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/40',
    gradient: 'from-[var(--accent-sage)]/12',
    cardBg: 'bg-gradient-to-br from-white to-[var(--primary-cream)]/70',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700',
    accent: 'var(--accent-sage)'
  },
  yellow: {
    border: 'hover:border-[var(--premium-gold)]/70',
    icon: 'bg-gradient-to-br from-[var(--premium-gold)]/15 to-[var(--premium-gold)]/25',
    iconText: 'text-[var(--premium-gold)]',
    title: 'group-hover:text-[var(--primary-navy)]',
    subtitle: 'text-[var(--premium-gold)]',
    checkmark: 'bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/40',
    gradient: 'from-[var(--premium-gold)]/12',
    cardBg: 'bg-gradient-to-br from-white to-[var(--primary-cream)]/90',
    textPrimary: 'text-[var(--primary-navy)]',
    textSecondary: 'text-slate-700',
    accent: 'var(--premium-gold)'
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
  priorityBadge,
  layout = 'default'
}) => {
  const colors = colorClasses[colorScheme];

  // UPLOAD LAYOUT - Document/File Upload Visualization
  if (layout === 'upload') {
    return (
      <div className={`group relative ${colors.cardBg} backdrop-blur-lg rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 border-2 border-[var(--warm-beige)] ${colors.border} transform hover:-translate-y-3 overflow-hidden`}>
        
        {/* Clean cream background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[var(--primary-cream)]/50 opacity-95"></div>
        
        <div className="relative z-10 p-10">
          {/* Large Document Upload Area */}
          <div className="mb-8 p-8 rounded-2xl border-2 border-dashed border-[var(--cta-orange)]/40 bg-[var(--primary-cream)]/90 hover:border-[var(--cta-orange)]/60 transition-all duration-300 cursor-pointer group-hover:scale-105">
            <div className="text-center">
              <div className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                <div className={`${colors.iconText} group-hover:scale-110 transition-transform duration-300`}>
                  {icon}
                </div>
              </div>
              <div className="text-[var(--cta-orange)] font-bold text-lg mb-2">Drop Your Syllabus Here</div>
              <div className="text-slate-600 text-sm">PDF → Task List in 30 Seconds</div>
            </div>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <h3 className="text-3xl font-black text-[var(--primary-navy)] mb-3">{title}</h3>
            <p className="text-[var(--cta-orange)] font-bold text-lg mb-4">{subtitle}</p>
            <p className="text-slate-700 leading-relaxed text-lg">{description}</p>
          </div>
          
          {/* Features as a horizontal flow */}
          <div className="flex flex-wrap gap-3 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center bg-white/80 border border-[var(--primary-cream)] rounded-full px-4 py-2 shadow-md">
                <div className="w-6 h-6 bg-[var(--accent-sage)]/20 text-[var(--accent-sage)] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-slate-700 text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // COMPARISON LAYOUT - Before/After Split Design
  if (layout === 'comparison') {
    return (
      <div className={`group relative ${colors.cardBg} backdrop-blur-lg rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 border-2 border-[var(--warm-beige)] ${colors.border} transform hover:-translate-y-3 overflow-hidden`}>
        
        {/* Clean cream background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[var(--primary-cream)]/40 opacity-95"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="p-8 pb-0">
            <div className="flex items-center mb-6">
              <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}>
                <div className={`${colors.iconText}`}>{icon}</div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--accent-navy)] mb-1">{title}</h3>
                <p className="text-[var(--accent-sage)] font-bold">{subtitle}</p>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed mb-6">{description}</p>
          </div>
          
          {/* Before/After Split */}
          <div className="grid grid-cols-2 gap-0 border-t-2 border-[var(--warm-beige)]">
            {/* BEFORE */}
            <div className="p-6 bg-red-50/50 border-r border-[var(--warm-beige)]">
              <div className="text-red-600 font-bold mb-3 text-center">❌ BEFORE</div>
              <div className="text-xs text-red-700 space-y-2">
                <div>• Manual Canvas copying</div>
                <div>• 1+ hour setup time</div>
                <div>• Missing assignments</div>
              </div>
            </div>
            
            {/* AFTER */}
            <div className="p-6 bg-green-50/50">
              <div className="text-[var(--accent-sage)] font-bold mb-3 text-center">✅ AFTER</div>
              <div className="text-xs text-green-700 space-y-2">
                <div>• Copy-paste Canvas link</div>
                <div>• 10 seconds total</div>
                <div>• Perfect sync</div>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="p-6 pt-4 space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <div className="w-7 h-7 bg-[var(--accent-sage)]/20 text-[var(--accent-sage)] rounded-lg flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-700 text-sm font-medium leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CHAT LAYOUT - Chat Interface Design  
  if (layout === 'chat') {
    return (
      <div className={`group relative ${colors.cardBg} backdrop-blur-lg rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 border-2 border-[var(--warm-beige)] ${colors.border} transform hover:-translate-y-3 overflow-hidden`}>
        
        {/* Clean cream background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[var(--primary-cream)]/40 opacity-95"></div>
        
        <div className="relative z-10 p-8">
          {/* Chat Header */}
          <div className="flex items-center mb-6 p-4 bg-[var(--rich-cream)]/80 rounded-xl border border-[var(--warm-beige)]">
            <div className={`w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center mr-4 shadow-lg`}>
              <div className={`${colors.iconText}`}>{icon}</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--accent-navy)]">{title}</h3>
              <p className="text-[var(--accent-sage)] text-sm font-medium">{subtitle}</p>
            </div>
            <div className="ml-auto w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* Chat Messages */}
          <div className="space-y-4 mb-6">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-[var(--accent-navy)] text-white rounded-2xl px-4 py-3 max-w-xs shadow-lg">
                <div className="text-sm">"When's the midterm?"</div>
              </div>
            </div>
            
            {/* Bot Response */}
            <div className="flex justify-start">
              <div className="bg-[var(--rich-cream)] text-slate-700 rounded-2xl px-4 py-3 max-w-xs shadow-lg border border-[var(--warm-beige)]">
                <div className="text-sm">Based on your syllabus: <span className="font-bold text-[var(--accent-navy)]">October 15th, 3:00 PM</span></div>
              </div>
            </div>
            
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-[var(--accent-navy)] text-white rounded-2xl px-4 py-3 max-w-xs shadow-lg">
                <div className="text-sm">"What's the late policy?"</div>
              </div>
            </div>
            
            {/* Bot Response */}
            <div className="flex justify-start">
              <div className="bg-[var(--rich-cream)] text-slate-700 rounded-2xl px-4 py-3 max-w-xs shadow-lg border border-[var(--warm-beige)]">
                <div className="text-sm">From page 3: <span className="font-bold text-red-600">10% penalty per day</span>, up to 3 days max.</div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-slate-700 leading-relaxed mb-6 text-center bg-[var(--rich-cream)]/60 rounded-xl p-4">{description}</p>
          
          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <div className="w-7 h-7 bg-[var(--accent-sage)]/20 text-[var(--accent-sage)] rounded-lg flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-700 text-sm font-medium leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT LAYOUT (Fallback)
  return (
    <div className={`group relative ${colors.cardBg} backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-700 border-2 border-[var(--warm-beige)] ${colors.border} transform hover:-translate-y-2 hover:scale-105 overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} to-transparent opacity-20`}></div>
      <div className="relative z-10">
        <div className="flex items-center mb-6">
          <div className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}>
            <div className={`${colors.iconText}`}>{icon}</div>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2`}>{title}</h3>
            <span className={`text-base ${colors.subtitle} font-bold`}>{subtitle}</span>
          </div>
        </div>
        <p className={`${colors.textSecondary} mb-6 leading-relaxed`}>{description}</p>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <div className={`w-7 h-7 ${colors.checkmark} rounded-lg flex items-center justify-center mr-4 mt-0.5 flex-shrink-0`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`${colors.textSecondary} text-sm font-medium leading-relaxed`}>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;