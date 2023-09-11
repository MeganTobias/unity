import React from 'react';

interface FormFieldCountProps {
  current: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const FormFieldCount: React.FC<FormFieldCountProps> = ({
  current,
  max,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-500',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const getVariant = () => {
    if (max && current > max) return 'error';
    if (max && current > max * 0.8) return 'warning';
    if (max && current <= max * 0.5) return 'success';
    return variant;
  };

  const currentVariant = getVariant();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className={`${sizeClasses[size]} ${variantClasses[currentVariant]}`}>
        {current}
      </span>
      {max && (
        <>
          <span className={`${sizeClasses[size]} text-gray-400`}>
            /
          </span>
          <span className={`${sizeClasses[size]} text-gray-500`}>
            {max}
          </span>
        </>
      )}
    </div>
  );
};

export default FormFieldCount;
