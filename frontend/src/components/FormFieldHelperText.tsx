import React from 'react';

interface FormFieldHelperTextProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const FormFieldHelperText: React.FC<FormFieldHelperTextProps> = ({
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
    default: 'text-gray-500',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  return (
    <p className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </p>
  );
};

export default FormFieldHelperText;
