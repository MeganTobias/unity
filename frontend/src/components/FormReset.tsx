import React from 'react';
import Button from './Button';

interface FormResetProps {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormReset: React.FC<FormResetProps> = ({
  children,
  disabled = false,
  variant = 'outline',
  size = 'md',
  className = ''
}) => {
  return (
    <Button
      type="reset"
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
};

export default FormReset;
