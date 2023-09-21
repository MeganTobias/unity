import React from 'react';

interface FormFieldPrefixProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const FormFieldPrefix: React.FC<FormFieldPrefixProps> = ({
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
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default FormFieldPrefix;
