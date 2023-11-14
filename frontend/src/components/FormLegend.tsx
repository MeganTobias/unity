import React from 'react';

interface FormLegendProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  className?: string;
}

const FormLegend: React.FC<FormLegendProps> = ({
  children,
  size = 'md',
  required = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <legend className={`font-medium text-gray-900 ${sizeClasses[size]} ${className}`}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </legend>
  );
};

export default FormLegend;

