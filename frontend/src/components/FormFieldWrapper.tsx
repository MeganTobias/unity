import React from 'react';

interface FormFieldWrapperProps {
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  children,
  label,
  required = false,
  error,
  helperText,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 pointer-events-none' : '';

  return (
    <div className={`space-y-2 ${disabledClasses} ${className}`}>
      {label && (
        <label className={`block font-medium text-gray-700 ${sizeClasses[size]}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-1">
        {children}
      </div>
      
      {error && (
        <p className={`text-red-600 ${sizeClasses[size]}`}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className={`text-gray-500 ${sizeClasses[size]}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormFieldWrapper;
