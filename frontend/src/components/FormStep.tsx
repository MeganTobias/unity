import React from 'react';

interface FormStepProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  isDisabled?: boolean;
  stepNumber: number;
  onStepClick?: () => void;
  className?: string;
}

const FormStep: React.FC<FormStepProps> = ({
  children,
  title,
  description,
  isActive = false,
  isCompleted = false,
  isDisabled = false,
  stepNumber,
  onStepClick,
  className = ''
}) => {
  const handleClick = () => {
    if (!isDisabled && onStepClick) {
      onStepClick();
    }
  };

  const getStepIcon = () => {
    if (isCompleted) {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <span className="text-sm font-medium">
        {stepNumber}
      </span>
    );
  };

  const getStepClasses = () => {
    if (isCompleted) {
      return 'bg-green-600 text-white';
    }
    if (isActive) {
      return 'bg-blue-600 text-white';
    }
    if (isDisabled) {
      return 'bg-gray-300 text-gray-500';
    }
    return 'bg-gray-200 text-gray-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`flex items-center space-x-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleClick}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepClasses()}`}>
          {getStepIcon()}
        </div>
        
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
      </div>
      
      {isActive && (
        <div className="ml-11">
          {children}
        </div>
      )}
    </div>
  );
};

export default FormStep;
