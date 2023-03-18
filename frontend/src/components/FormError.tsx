import React from 'react';

interface FormErrorProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({
  children,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <p className={`text-red-600 ${sizeClasses[size]} ${className}`}>
      {children}
    </p>
  );
};

export default FormError;
