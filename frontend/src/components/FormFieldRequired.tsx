import React from 'react';

interface FormFieldRequiredProps {
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldRequired: React.FC<FormFieldRequiredProps> = ({
  required = false,
  size = 'md',
  className = ''
}) => {
  if (!required) return null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <span className={`text-red-500 ml-1 ${sizeClasses[size]} ${className}`}>
      *
    </span>
  );
};

export default FormFieldRequired;
