import React from 'react';

interface FormFieldBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldBadge: React.FC<FormFieldBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default FormFieldBadge;
