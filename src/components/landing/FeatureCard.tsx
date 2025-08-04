import React from 'react';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  imageAlt: string;
  imageSrc?: string;
  icon: React.ReactNode;
  colorScheme: 'blue' | 'green' | 'yellow' | 'indigo' | 'red';
  priority?: boolean;
  priorityBadge?: string;
}

const colorClasses = {
  blue: {
    border: 'hover:border-blue-200',
    icon: 'bg-gradient-to-br from-blue-100 to-blue-200',
    iconText: 'text-blue-600',
    title: 'group-hover:text-blue-600',
    subtitle: 'text-blue-600',
    checkmark: 'bg-blue-100 text-blue-600',
    gradient: 'from-blue-600/20'
  },
  green: {
    border: 'hover:border-green-200',
    icon: 'bg-gradient-to-br from-green-100 to-green-200',
    iconText: 'text-green-600',
    title: 'group-hover:text-green-600',
    subtitle: 'text-green-600',
    checkmark: 'bg-green-100 text-green-600',
    gradient: 'from-green-600/20'
  },
  yellow: {
    border: 'hover:border-yellow-200',
    icon: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
    iconText: 'text-yellow-600',
    title: 'group-hover:text-yellow-600',
    subtitle: 'text-yellow-600',
    checkmark: 'bg-yellow-100 text-yellow-600',
    gradient: 'from-yellow-600/20'
  },
  indigo: {
    border: 'hover:border-indigo-200',
    icon: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
    iconText: 'text-indigo-600',
    title: 'group-hover:text-indigo-600',
    subtitle: 'text-indigo-600',
    checkmark: 'bg-indigo-100 text-indigo-600',
    gradient: 'from-indigo-600/20'
  },
  red: {
    border: 'hover:border-red-200',
    icon: 'bg-gradient-to-br from-red-100 to-red-200',
    iconText: 'text-red-600',
    title: 'group-hover:text-red-600',
    subtitle: 'text-red-600',
    checkmark: 'bg-red-100 text-red-600',
    gradient: 'from-red-600/20'
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
    <div className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 ${colors.border} transform hover:-translate-y-2`}>
      {/* Priority badge */}
      {priority && priorityBadge && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {priorityBadge}
        </div>
      )}
      
      <div className="text-center mb-6">
        <div className="relative overflow-hidden rounded-xl">
          <img 
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-36 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${colors.gradient} to-transparent rounded-xl`}></div>
        </div>
      </div>
      
      <div className="flex items-center mb-4">
        <div className={`w-14 h-14 ${colors.icon} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
          <div className={colors.iconText}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className={`text-xl font-bold text-gray-900 mb-1 ${colors.title} transition-colors`}>
            {title}
          </h3>
          <span className={`text-sm ${colors.subtitle} font-medium`}>
            {subtitle}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 mb-6 leading-relaxed">
        {description}
      </p>
      
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center text-sm text-gray-700">
            <div className={`w-5 h-5 ${colors.checkmark} rounded-full flex items-center justify-center mr-3`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCard;