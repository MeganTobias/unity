import React from 'react';
import Button from './Button';

interface FormCancelProps {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormCancel: React.FC<FormCancelProps> = ({
  children,
  disabled = false,
  variant = 'outline',
  size = 'md',
  className = ''
}) => {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
};

export default FormCancel;
