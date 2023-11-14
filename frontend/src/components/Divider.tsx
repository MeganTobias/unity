import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow';
  thickness?: 'thin' | 'medium' | 'thick';
  className?: string;
}

const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  color = 'gray',
  thickness = 'thin',
  className = ''
}) => {
  const orientationClasses = {
    horizontal: 'w-full',
    vertical: 'h-full'
  };

  const variantClasses = {
    solid: 'border-solid',
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

  const verticalThicknessClasses = {
    thin: 'border-l',
    medium: 'border-l-2',
    thick: 'border-l-4'
  };

  const baseClasses = orientation === 'horizontal' 
    ? `border-t ${thicknessClasses[thickness]}`
    : `border-l ${verticalThicknessClasses[thickness]}`;

  return (
    <div
      className={`
        ${orientationClasses[orientation]}
        ${baseClasses}
        ${variantClasses[variant]}
        ${colorClasses[color]}
        ${className}
      `}
    />
  );
};

export default Divider;

