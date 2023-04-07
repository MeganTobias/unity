import React from 'react';

interface FormFieldsetProps {
  children: React.ReactNode;
  legend?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'default' | 'bordered' | 'card';
  className?: string;
}

const FormFieldset: React.FC<FormFieldsetProps> = ({
  children,
  legend,
  description,
  disabled = false,
  variant = 'default',
  className = ''
}) => {
  const variantClasses = {
    default: '',
    bordered: 'border border-gray-200 rounded-lg p-4',
    card: 'bg-white border border-gray-200 rounded-lg shadow-sm p-6'
  };

  const disabledClasses = disabled ? 'opacity-50 pointer-events-none' : '';

  return (
    <fieldset className={`space-y-4 ${variantClasses[variant]} ${disabledClasses} ${className}`}>
      {legend && (
        <legend className="text-base font-medium text-gray-900 mb-2">
          {legend}
        </legend>
      )}
      
      {description && (
        <p className="text-sm text-gray-500 mb-4">
          {description}
        </p>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
};

export default FormFieldset;
