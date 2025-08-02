import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
  const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:focus:ring-0';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-gray-800 hover:bg-gray-900 focus:bg-gray-900 active:bg-gray-950 text-white shadow-sm hover:shadow-md',
    outline: 'border-2 border-gray-300 hover:border-gray-400 focus:border-blue-500 text-gray-700 bg-white hover:bg-gray-50 focus:bg-blue-50',
    ghost: 'text-gray-600 hover:text-gray-900 focus:text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
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