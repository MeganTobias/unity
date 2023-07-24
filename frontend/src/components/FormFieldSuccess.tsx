import React from 'react';

interface FormFieldSuccessProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'info';
  className?: string;
}

const FormFieldSuccess: React.FC<FormFieldSuccessProps> = ({
  children,
  size = 'md',
  variant = 'success',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600',
    success: 'text-green-600',
    info: 'text-blue-600'
  };

  return (
    <div className={`flex items-start space-x-2 ${className}`}>
      <svg
        className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <p className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
        {children}
      </p>
    </div>
  );
};

export default FormFieldSuccess;
