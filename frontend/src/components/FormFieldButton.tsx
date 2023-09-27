import React from 'react';
import Button from './Button';

interface FormFieldButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormFieldButton: React.FC<FormFieldButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  );
};

export default FormFieldButton;
