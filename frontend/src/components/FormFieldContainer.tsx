import React from 'react';

interface FormFieldContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'card' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldContainer: React.FC<FormFieldContainerProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const variantClasses = {
    default: '',
    bordered: 'border border-gray-200 rounded-lg',
    card: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    outlined: 'border-2 border-gray-300 rounded-lg',
    filled: 'bg-gray-50 rounded-lg'
  };

  return (
    <div className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default FormFieldContainer;
