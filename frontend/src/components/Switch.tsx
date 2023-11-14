import React, { forwardRef } from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-8'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const labelSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'bg-gray-200 peer-checked:bg-blue-600',
    primary: 'bg-gray-200 peer-checked:bg-blue-600',
    success: 'bg-gray-200 peer-checked:bg-green-600',
    warning: 'bg-gray-200 peer-checked:bg-yellow-600',
    error: 'bg-gray-200 peer-checked:bg-red-600'
  };

  const errorClasses = error ? 'ring-red-500' : '';

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              ${sizeClasses[size]}
              bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300
              ${variantClasses[variant]}
              ${errorClasses}
              rounded-full peer peer-checked:after:translate-x-full
              peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px]
              after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all
              peer-checked:after:border-white after:${thumbSizeClasses[size]}
            `}
          />
        </label>
      </div>
      
      {label && (
        <div className="ml-3 text-sm">
          <label
            htmlFor={props.id}
            className={`
              ${labelSizeClasses[size]}
              font-medium
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

Switch.displayName = 'Switch';

export default Switch;

