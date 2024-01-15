import React from 'react';

interface FormFieldStackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

const FormFieldStack: React.FC<FormFieldStackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  className = ''
}) => {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col'
  };

  const spacingClasses = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={`flex ${directionClasses[direction]} ${spacingClasses[spacing]} ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
};

export default FormFieldStack;