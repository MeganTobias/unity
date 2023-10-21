import React from 'react';

interface FormFieldLayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}

const FormFieldLayout: React.FC<FormFieldLayoutProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
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

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const wrapClasses = wrap ? 'flex-wrap' : 'flex-nowrap';

  return (
    <div className={`flex ${directionClasses[direction]} ${spacingClasses[spacing]} ${alignClasses[align]} ${justifyClasses[justify]} ${wrapClasses} ${className}`}>
      {children}
    </div>
  );
};

export default FormFieldLayout;
