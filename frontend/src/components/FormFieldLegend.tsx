import React from 'react';

interface FormFieldLegendProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const FormFieldLegend: React.FC<FormFieldLegendProps> = ({
  children,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-900',
    primary: 'text-blue-900',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    error: 'text-red-900'
  };

  return (
    <legend className={`font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </legend>
  );
};

export default FormFieldLegend;
