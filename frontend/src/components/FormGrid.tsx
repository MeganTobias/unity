import React from 'react';

interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}

const FormGrid: React.FC<FormGridProps> = ({
  children,
  columns = 1,
  gap = 'md',
  responsive = true,
  className = ''
}) => {
  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const getColumnClasses = () => {
    if (!responsive) {
      return `grid-cols-${columns}`;
    }

    const responsiveClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
      12: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12'
    };

    return responsiveClasses[columns];
  };

  return (
    <div className={`grid ${getColumnClasses()} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export default FormGrid;
