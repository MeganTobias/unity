import React from 'react';
import Button from './Button';

interface FormActionsProps {
  onSubmit?: () => void;
  onReset?: () => void;
  onCancel?: () => void;
  submitText?: string;
  resetText?: string;
  cancelText?: string;
  loading?: boolean;
  disabled?: boolean;
  showReset?: boolean;
  showCancel?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  onReset,
  onCancel,
  submitText = 'Submit',
  resetText = 'Reset',
  cancelText = 'Cancel',
  loading = false,
  disabled = false,
  showReset = true,
  showCancel = false,
  align = 'right',
  className = ''
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div className={`flex items-center space-x-3 ${alignClasses[align]} ${className}`}>
      {showCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={disabled || loading}
        >
          {cancelText}
        </Button>
      )}
      
      {showReset && (
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={disabled || loading}
        >
          {resetText}
        </Button>
      )}
      
      <Button
        type="submit"
        variant="primary"
        onClick={onSubmit}
        loading={loading}
        disabled={disabled}
      >
        {submitText}
      </Button>
    </div>
  );
};

export default FormActions;

