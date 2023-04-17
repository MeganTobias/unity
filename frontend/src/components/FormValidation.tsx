import React from 'react';

interface FormValidationProps {
  children: React.ReactNode;
  rules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
  error?: string;
  touched?: boolean;
  className?: string;
}

const FormValidation: React.FC<FormValidationProps> = ({
  children,
  rules = {},
  error = '',
  touched = false,
  className = ''
}) => {
  const validate = (value: any): string | null => {
    if (rules.required && (!value || value.toString().trim() === '')) {
      return 'This field is required';
    }

    if (rules.minLength && value && value.toString().length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }

    if (rules.maxLength && value && value.toString().length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }

    if (rules.pattern && value && !rules.pattern.test(value.toString())) {
      return 'Invalid format';
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  };

  const validationError = validate(children);

  if (!touched || !validationError) {
    return <>{children}</>;
  }

  return (
    <div className={className}>
      {children}
      <p className="mt-1 text-sm text-red-600">
        {validationError}
      </p>
    </div>
  );
};

export default FormValidation;
