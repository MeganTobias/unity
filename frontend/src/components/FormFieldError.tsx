import React from 'react';

interface FormFieldErrorProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'warning';
  className?: string;
}

const FormFieldError: React.FC<FormFieldErrorProps> = ({
  children,
  size = 'md',
  variant = 'error',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600',
    error: 'text-red-600',
    warning: 'text-yellow-600'
  };

  return (
    <p className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </p>
  );
};

export default FormFieldError;
