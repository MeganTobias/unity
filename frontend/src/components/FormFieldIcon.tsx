import React from 'react';

interface FormFieldIconProps {
  icon: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gray';
  className?: string;
}

const FormFieldIcon: React.FC<FormFieldIconProps> = ({
  icon,
  position = 'left',
  size = 'md',
  color = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    default: 'text-gray-500',
    primary: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    gray: 'text-gray-400'
  };

  const positionClasses = {
    left: 'mr-2',
    right: 'ml-2'
  };

  return (
    <div className={`flex items-center ${positionClasses[position]} ${className}`}>
      <div className={`${sizeClasses[size]} ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
};

export default FormFieldIcon;