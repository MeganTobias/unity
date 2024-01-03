import React from 'react';

interface FormFieldPlaceholderProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'disabled';
  className?: string;
}

const FormFieldPlaceholder: React.FC<FormFieldPlaceholderProps> = ({
  children,
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
    muted: 'text-gray-400',
    disabled: 'text-gray-300'
  };

  return (
    <div className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default FormFieldPlaceholder;