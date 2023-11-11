import React from 'react';

interface FormFieldGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  variant?: 'default' | 'bordered' | 'card' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  children,
  title,
  description,
  required = false,
  error,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: '',
    bordered: 'border border-gray-200 rounded-lg p-4',
    card: 'bg-white border border-gray-200 rounded-lg shadow-sm p-6',
    outlined: 'border-2 border-gray-300 rounded-lg p-4'
  };

  const disabledClasses = disabled ? 'opacity-50 pointer-events-none' : '';

  return (
    <div className={`space-y-4 ${variantClasses[variant]} ${disabledClasses} ${className}`}>
      {title && (
        <div className="flex items-center space-x-2">
          <h3 className={`font-medium text-gray-900 ${sizeClasses[size]}`}>
            {title}
          </h3>
          {required && <span className="text-red-500">*</span>}
        </div>
      )}
      
      {description && (
        <p className={`text-gray-500 ${sizeClasses[size]}`}>
          {description}
        </p>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
      
      {error && (
        <p className={`text-red-600 ${sizeClasses[size]}`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormFieldGroup;