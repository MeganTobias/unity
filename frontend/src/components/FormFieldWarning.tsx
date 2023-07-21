import React from 'react';

interface FormFieldWarningProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'warning' | 'error';
  className?: string;
}

const FormFieldWarning: React.FC<FormFieldWarningProps> = ({
  children,
  size = 'md',
  variant = 'warning',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <div className={`flex items-start space-x-2 ${className}`}>
      <svg
        className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <p className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
        {children}
      </p>
    </div>
  );
};

export default FormFieldWarning;
