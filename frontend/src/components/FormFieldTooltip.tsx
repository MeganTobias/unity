import React from 'react';

interface FormFieldTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dark' | 'light';
  className?: string;
}

const FormFieldTooltip: React.FC<FormFieldTooltipProps> = ({
  children,
  content,
  position = 'top',
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  const variantClasses = {
    default: 'bg-gray-900 text-white',
    dark: 'bg-black text-white',
    light: 'bg-white text-gray-900 border border-gray-200'
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900'
  };

  return (
    <div className={`relative group ${className}`}>
      {children}
      <div className={`absolute z-10 invisible group-hover:visible ${positionClasses[position]}`}>
        <div className={`relative rounded shadow-lg ${sizeClasses[size]} ${variantClasses[variant]}`}>
          {content}
          <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`} />
        </div>
      </div>
    </div>
  );
};

export default FormFieldTooltip;