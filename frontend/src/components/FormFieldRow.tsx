import React from 'react';

interface FormFieldRowProps {
  children: React.ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}

const FormFieldRow: React.FC<FormFieldRowProps> = ({
  children,
  spacing = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className = ''
}) => {
  const spacingClasses = {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8'
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
    <div className={`flex flex-row ${spacingClasses[spacing]} ${alignClasses[align]} ${justifyClasses[justify]} ${wrapClasses} ${className}`}>
      {children}
    </div>
  );
};

export default FormFieldRow;