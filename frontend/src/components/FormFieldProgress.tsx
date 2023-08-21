import React from 'react';
import ProgressBar from './ProgressBar';

interface FormFieldProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldProgress: React.FC<FormFieldProgressProps> = ({
  value,
  max = 100,
  showLabel = true,
  showPercentage = true,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const percentage = Math.round((value / max) * 100);
  const isComplete = value >= max;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={`font-medium ${sizeClasses[size]} ${variantClasses[variant]}`}>
            Progress
          </span>
          {showPercentage && (
            <span className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
              {percentage}%
            </span>
          )}
        </div>
      )}
      
      <ProgressBar
        value={value}
        max={max}
        variant={isComplete ? 'success' : variant}
        size={size}
        showLabel={false}
      />
      
      {isComplete && (
        <div className="flex items-center space-x-2 text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className={`${sizeClasses[size]} font-medium`}>
            Complete!
          </span>
        </div>
      )}
    </div>
  );
};

export default FormFieldProgress;
