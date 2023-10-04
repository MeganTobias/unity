import React from 'react';

interface FormFieldTextProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'success' | 'warning' | 'error' | 'info';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

const FormFieldText: React.FC<FormFieldTextProps> = ({
  children,
  size = 'md',
  variant = 'default',
  weight = 'normal',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-900',
    muted: 'text-gray-500',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  return (
    <span className={`${sizeClasses[size]} ${variantClasses[variant]} ${weightClasses[weight]} ${className}`}>
      {children}
    </span>
  );
};

export default FormFieldText;
