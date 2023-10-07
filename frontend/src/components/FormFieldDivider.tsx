import React from 'react';

interface FormFieldDividerProps {
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dashed' | 'dotted';
  className?: string;
}

const FormFieldDivider: React.FC<FormFieldDividerProps> = ({
  orientation = 'horizontal',
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: orientation === 'horizontal' ? 'h-px' : 'w-px',
    md: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
    lg: orientation === 'horizontal' ? 'h-1' : 'w-1'
  };

  const variantClasses = {
    default: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted'
  };

  const orientationClasses = {
    horizontal: 'w-full border-t border-gray-200',
    vertical: 'h-full border-l border-gray-200'
  };

  return (
    <div
      className={`${sizeClasses[size]} ${variantClasses[variant]} ${orientationClasses[orientation]} ${className}`}
    />
  );
};

export default FormFieldDivider;
