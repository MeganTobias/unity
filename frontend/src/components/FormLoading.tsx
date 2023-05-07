import React from 'react';
import Spinner from './Spinner';

interface FormLoadingProps {
  loading?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormLoading: React.FC<FormLoadingProps> = ({
  loading = false,
  text = 'Loading...',
  size = 'md',
  className = ''
}) => {
  if (!loading) return null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Spinner size={size} color="primary" />
      <span className={`text-gray-600 ${sizeClasses[size]}`}>
        {text}
      </span>
    </div>
  );
};

export default FormLoading;
