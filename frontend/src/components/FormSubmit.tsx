import React from 'react';
import Button from './Button';

interface FormSubmitProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormSubmit: React.FC<FormSubmitProps> = ({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
};

export default FormSubmit;
