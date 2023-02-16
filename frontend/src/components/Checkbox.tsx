import React, { forwardRef } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const labelSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-blue-600 focus:ring-blue-500',
    primary: 'text-blue-600 focus:ring-blue-500',
    success: 'text-green-600 focus:ring-green-500',
    warning: 'text-yellow-600 focus:ring-yellow-500',
    error: 'text-red-600 focus:ring-red-500'
  };

  const errorClasses = error ? 'border-red-300 focus:ring-red-500' : '';

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          ref={ref}
          type="checkbox"
          className={`
            ${sizeClasses[size]}
            rounded border-gray-300
            ${variantClasses[variant]}
            ${errorClasses}
            focus:ring-2
            transition-colors duration-200
          `}
          {...props}
        />
      </div>
      
      {label && (
        <div className="ml-3 text-sm">
          <label
            htmlFor={props.id}
            className={`
              ${labelSizeClasses[size]}
              font-medium text-gray-700
              ${props.disabled ? 'text-gray-400' : 'text-gray-700'}
              cursor-pointer
            `}
          >
            {label}
          </label>
          
          {helperText && !error && (
            <p className="mt-1 text-sm text-gray-500">{helperText}</p>
          )}
          
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
