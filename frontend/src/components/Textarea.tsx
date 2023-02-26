import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  className?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  resize = 'vertical',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500';
  
  const variantClasses = {
    default: 'bg-white',
    filled: 'bg-gray-50 border-gray-200',
    outlined: 'bg-transparent border-2'
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-3',
    lg: 'text-lg px-4 py-4'
  };

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${resizeClasses[resize]}
          ${errorClasses}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
