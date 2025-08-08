import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cta-orange' | 'cta-yellow' | 'navy' | 'sage';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  href?: string;
  dataTestId?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  text, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  ariaLabel, 
  className = '',
  disabled = false,
  href,
  dataTestId
}) => {
  const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:focus:ring-0';
  
  const variantStyles = {
    primary: 'bg-[var(--primary-navy)] hover:bg-[var(--primary-navy)]/90 focus:bg-[var(--primary-navy)]/90 active:bg-[var(--primary-navy)]/80 text-white shadow-lg hover:shadow-xl focus:ring-[var(--primary-navy)] font-semibold',
    secondary: 'bg-gray-800 hover:bg-gray-900 focus:bg-gray-900 active:bg-gray-950 text-white shadow-sm hover:shadow-md focus:ring-gray-800',
    outline: 'border-2 border-gray-300 hover:border-[var(--primary-navy)] focus:border-[var(--primary-navy)] text-gray-700 bg-white hover:bg-[var(--primary-navy)]/5 focus:bg-[var(--primary-navy)]/5 focus:ring-[var(--primary-navy)]',
    ghost: 'text-gray-600 hover:text-gray-900 focus:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:ring-gray-600',
    'cta-orange': 'bg-[var(--cta-orange)] hover:bg-[var(--cta-orange)]/90 focus:bg-[var(--cta-orange)]/90 active:bg-[var(--cta-orange)]/80 text-white shadow-lg hover:shadow-xl focus:ring-[var(--cta-orange)] font-bold',
    'cta-yellow': 'bg-[var(--premium-gold)] hover:bg-[var(--premium-gold)]/90 focus:bg-[var(--premium-gold)]/90 active:bg-[var(--premium-gold)]/80 text-gray-900 shadow-lg hover:shadow-xl focus:ring-[var(--premium-gold)]',
    'navy': 'bg-[var(--primary-navy)] hover:bg-[var(--primary-navy)]/90 focus:bg-[var(--primary-navy)]/90 active:bg-[var(--primary-navy)]/80 text-white shadow-lg hover:shadow-xl focus:ring-[var(--primary-navy)] font-semibold',
    'sage': 'bg-[var(--accent-sage)] hover:bg-[var(--accent-sage)]/90 focus:bg-[var(--accent-sage)]/90 active:bg-[var(--accent-sage)]/80 text-white shadow-lg hover:shadow-xl focus:ring-[var(--accent-sage)]'
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-2 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-lg'
  };

  const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {text}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
      disabled={disabled}
      data-testid={dataTestId}
    >
      {text}
    </button>
  );
};

export default Button;