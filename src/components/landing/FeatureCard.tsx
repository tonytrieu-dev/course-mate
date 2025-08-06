import React from 'react';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  imageAlt: string;
  imageSrc?: string;
  icon: React.ReactNode;
  colorScheme: 'blue' | 'green' | 'yellow' | 'indigo' | 'red' | 'teal' | 'coral' | 'orange' | 'cyan';
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
  },
  green: {
    border: 'hover:border-green-300/70',
    icon: 'bg-gradient-to-br from-green-100/80 to-emerald-200/90',
    iconText: 'text-green-700',
    title: 'group-hover:text-green-800',
    subtitle: 'text-green-600',
    checkmark: 'bg-green-100/90 text-green-700 border border-green-300/60',
    gradient: 'from-green-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-green-100/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-700'
  },
  yellow: {
    border: 'hover:border-yellow-300/70',
    icon: 'bg-gradient-to-br from-yellow-100/80 to-amber-200/90',
    iconText: 'text-yellow-700',
    title: 'group-hover:text-yellow-800',
    subtitle: 'text-yellow-600',
    checkmark: 'bg-yellow-100/90 text-yellow-700 border border-yellow-300/60',
    gradient: 'from-yellow-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-yellow-100/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-700'
  },
  indigo: {
    border: 'hover:border-indigo-300/70',
    icon: 'bg-gradient-to-br from-indigo-100/80 to-purple-200/90',
    iconText: 'text-indigo-700',
    title: 'group-hover:text-indigo-800',
    subtitle: 'text-indigo-600',
    checkmark: 'bg-indigo-100/90 text-indigo-700 border border-indigo-300/60',
    gradient: 'from-indigo-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-indigo-100/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-700'
  },
  red: {
    border: 'hover:border-red-300/70',
    icon: 'bg-gradient-to-br from-red-100/80 to-rose-200/90',
    iconText: 'text-red-700',
    title: 'group-hover:text-red-800',
    subtitle: 'text-red-600',
    checkmark: 'bg-red-100/90 text-red-700 border border-red-300/60',
    gradient: 'from-red-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-red-100/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-700'
  },
  teal: {
    border: 'hover:border-teal-300/70',
    icon: 'bg-gradient-to-br from-teal-100/80 to-cyan-200/90',
    iconText: 'text-teal-700',
    title: 'group-hover:text-teal-800',
    subtitle: 'text-teal-600',
    checkmark: 'bg-teal-100/90 text-teal-700 border border-teal-300/60',
    gradient: 'from-teal-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-teal-100/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-700'
  },
  coral: {
    border: 'hover:border-rose-300/70',
    icon: 'bg-gradient-to-br from-rose-100/80 to-pink-200/90',
    iconText: 'text-rose-700',
    title: 'group-hover:text-rose-800',
    subtitle: 'text-rose-600',
    checkmark: 'bg-rose-100/90 text-rose-700 border border-rose-300/60',
    gradient: 'from-rose-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-rose-100/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-700'
  },
  orange: {
    border: 'hover:border-orange-300/70',
    icon: 'bg-gradient-to-br from-orange-100/80 to-amber-200/90',
    iconText: 'text-orange-700',
    title: 'group-hover:text-orange-800',
    subtitle: 'text-orange-600',
    checkmark: 'bg-orange-100/90 text-orange-700 border border-orange-300/60',
    gradient: 'from-orange-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-orange-100/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-700'
  },
  cyan: {
    border: 'hover:border-cyan-300/70',
    icon: 'bg-gradient-to-br from-cyan-100/80 to-blue-200/90',
    iconText: 'text-cyan-700',
    title: 'group-hover:text-cyan-800',
    subtitle: 'text-cyan-600',
    checkmark: 'bg-cyan-100/90 text-cyan-700 border border-cyan-300/60',
    gradient: 'from-cyan-200/40',
    cardBg: 'bg-gradient-to-br from-white/95 to-cyan-100/80',
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
        <p className={`${colors.textSecondary} mb-8 leading-relaxed text-lg bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/30`}>
          {description}
        </p>
        
        {/* Feature list with artistic enhancement */}
        <div className="space-y-4" data-feature-list="true">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start group/feature" data-feature-item={index}>
              <div className={`w-6 h-6 ${colors.checkmark} rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/feature:scale-125 group-hover/feature:rotate-12 transition-all duration-300 shadow-lg`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
        
        {/* Artistic bottom accent with animation - moved outside of content area */}
        
        {/* Additional artistic elements */}
        <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 bg-gradient-to-tl from-indigo-100/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{transitionDelay: '200ms'}}></div>
      </div>
    </div>
  );
};

export default FeatureCard;