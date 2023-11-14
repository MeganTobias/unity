import React from 'react';

interface FormDescriptionProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'success' | 'warning' | 'error';
  className?: string;
}

const FormDescription: React.FC<FormDescriptionProps> = ({
  children,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const variantClasses = {
    default: 'text-gray-700',
    muted: 'text-gray-500',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <p className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </p>
  );
};

export default FormDescription;

