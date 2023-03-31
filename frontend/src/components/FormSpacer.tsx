import React from 'react';

interface FormSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const FormSpacer: React.FC<FormSpacerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
    '2xl': 'h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`} />
  );
};

export default FormSpacer;
