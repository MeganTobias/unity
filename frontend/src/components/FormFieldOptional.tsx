import React from 'react';

interface FormFieldOptionalProps {
  optional?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldOptional: React.FC<FormFieldOptionalProps> = ({
  optional = false,
  size = 'md',
  className = ''
}) => {
  if (!optional) return null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <span className={`text-gray-500 ml-1 ${sizeClasses[size]} ${className}`}>
      (optional)
    </span>
  );
};

export default FormFieldOptional;
