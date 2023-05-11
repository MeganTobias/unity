import React from 'react';

interface FormSuccessProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'info';
  className?: string;
}

const FormSuccess: React.FC<FormSuccessProps> = ({
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
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg
        className="w-5 h-5 text-green-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
        {children}
      </span>
    </div>
  );
};

export default FormSuccess;