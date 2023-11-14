import React from 'react';

interface FormInfoProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'info' | 'success';
  className?: string;
}

const FormInfo: React.FC<FormInfoProps> = ({
  children,
  size = 'md',
  variant = 'info',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600',
    info: 'text-blue-600',
    success: 'text-green-600'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg
        className="w-5 h-5 text-blue-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <span className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
        {children}
      </span>
    </div>
  );
};

export default FormInfo;

