import React from 'react';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  imageAlt: string;
  imageSrc?: string;
  icon: React.ReactNode;
  colorScheme: 'blue';
  priority?: boolean;
  priorityBadge?: string;
}

const colorClasses = {
  blue: {
    border: 'hover:border-blue-300/70',
    icon: 'bg-gradient-to-br from-blue-100/80 to-blue-200/90',
    iconText: 'text-blue-700',
    title: 'group-hover:text-blue-800',
    subtitle: 'text-blue-600',
    checkmark: 'bg-blue-100/90 text-blue-700 border border-blue-300/60',
    gradient: 'from-blue-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-blue-100/80',
    textPrimary: 'text-slate-800',
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
      {/* Priority badge with artistic enhancement */}
      {priority && priorityBadge && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl z-10">
          {priorityBadge}
        </div>
      )}
      
      {/* Artistic background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-700`}></div>
      
      {/* Artistic accent border */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-blue-100/20 to-transparent group-hover:via-blue-200/30 transition-all duration-700"></div>
      
      <div className="relative z-10">
        {/* Enhanced icon section with artistic treatment */}
        <div className="flex items-center mb-8">
          <div className={`w-20 h-20 ${colors.icon} backdrop-blur-sm rounded-3xl flex items-center justify-center mr-5 group-hover:scale-125 group-hover:rotate-3 transition-all duration-500 shadow-xl border border-slate-200/40`}>
            <div className={`${colors.iconText} filter drop-shadow-lg`}>
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2 ${colors.title} transition-colors duration-300 group-hover:scale-105 transform`}>
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
          <div className="aspect-video bg-gradient-to-br from-slate-100 via-blue-50/80 to-indigo-50/60 flex items-center justify-center relative">
            
            {/* Clean Feature Icon */}
            <div className={`w-20 h-20 ${colors.icon} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}>
              <div className={`${colors.iconText}`}>
                {icon}
              </div>
            </div>
            
            {/* Simple Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-transparent transition-all duration-300">
              <div className="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16 flex items-center justify-center shadow-xl cursor-pointer transform hover:scale-110 transition-all duration-300">
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
        
        {/* Artistic bottom accent with animation - moved outside of content area */}
        
        {/* Additional artistic elements */}
        <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 bg-gradient-to-tl from-indigo-100/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{transitionDelay: '200ms'}}></div>
      </div>
    </div>
  );
};

export default FeatureCard;