import React from 'react';

interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  required = false,
  error = false,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const colorClasses = error
    ? 'text-red-700'
    : disabled
    ? 'text-gray-400'
    : 'text-gray-700';

  return (
    <label
      htmlFor={htmlFor}
      className={`
        block font-medium
        ${sizeClasses[size]}
        ${colorClasses}
        ${className}
      `}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default FormLabel;
