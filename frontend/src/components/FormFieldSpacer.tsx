import React from 'react';

interface FormFieldSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

const FormFieldSpacer: React.FC<FormFieldSpacerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
    '2xl': 'h-12',
    '3xl': 'h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`} />
  );
};

export default FormFieldSpacer;