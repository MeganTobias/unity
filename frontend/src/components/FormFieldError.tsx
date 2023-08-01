import React from 'react';

interface FormFieldErrorProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'warning';
  className?: string;
}

const FormFieldError: React.FC<FormFieldErrorProps> = ({
  children,
  size = 'md',
  variant = 'error',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600',
    error: 'text-red-600',
    warning: 'text-yellow-600'
  };

  return (
    <div className={`flex items-start space-x-2 ${className}`}>
      <svg
        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <p className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
        {children}
      </p>
    </div>
  );
};

export default FormFieldError;