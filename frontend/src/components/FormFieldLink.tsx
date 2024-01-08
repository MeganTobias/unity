import React from 'react';

interface FormFieldLinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const FormFieldLink: React.FC<FormFieldLinkProps> = ({
  children,
  href,
  onClick,
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
    default: 'text-gray-600 hover:text-gray-800',
    primary: 'text-blue-600 hover:text-blue-800',
    success: 'text-green-600 hover:text-green-800',
    warning: 'text-yellow-600 hover:text-yellow-800',
    error: 'text-red-600 hover:text-red-800'
  };

  const baseClasses = 'underline hover:no-underline cursor-pointer';

  if (href) {
    return (
      <a
        href={href}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default FormFieldLink;