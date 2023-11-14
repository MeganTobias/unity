import React from 'react';

interface FormDividerProps {
  text?: string;
  variant?: 'default' | 'dashed' | 'dotted';
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow';
  thickness?: 'thin' | 'medium' | 'thick';
  className?: string;
}

const FormDivider: React.FC<FormDividerProps> = ({
  text,
  variant = 'default',
  color = 'gray',
  thickness = 'thin',
  className = ''
}) => {
  const variantClasses = {
    default: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted'
  };

  const colorClasses = {
    gray: 'border-gray-300',
    blue: 'border-blue-300',
    green: 'border-green-300',
    red: 'border-red-300',
    yellow: 'border-yellow-300'
  };

  const thicknessClasses = {
    thin: 'border-t',
    medium: 'border-t-2',
    thick: 'border-t-4'
  };

  const textColorClasses = {
    gray: 'text-gray-500',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  };

  if (text) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 flex items-center">
          <div className={`w-full ${thicknessClasses[thickness]} ${variantClasses[variant]} ${colorClasses[color]}`} />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className={`px-2 bg-white ${textColorClasses[color]}`}>
            {text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        w-full
        ${thicknessClasses[thickness]}
        ${variantClasses[variant]}
        ${colorClasses[color]}
        ${className}
      `}
    />
  );
};

export default FormDivider;

