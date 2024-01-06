import React from 'react';

interface FormFieldAddonProps {
  children: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const FormFieldAddon: React.FC<FormFieldAddonProps> = ({
  children,
  position = 'left',
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-3',
    lg: 'text-lg px-5 py-4'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border border-gray-300',
    primary: 'bg-blue-100 text-blue-700 border border-blue-300',
    success: 'bg-green-100 text-green-700 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    error: 'bg-red-100 text-red-700 border border-red-300'
  };

  const positionClasses = {
    left: 'rounded-l-md border-r-0',
    right: 'rounded-r-md border-l-0'
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${variantClasses[variant]} ${positionClasses[position]} ${className}`}>
      {children}
    </div>
  );
};

export default FormFieldAddon;