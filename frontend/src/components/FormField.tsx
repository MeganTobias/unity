import React from 'react';
import { useForm } from './Form';

interface FormFieldProps {
  name: string;
  label?: string;
  children: (props: {
    value: any;
    error: string;
    touched: boolean;
    onChange: (value: any) => void;
    onBlur: () => void;
  }) => React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  children,
  className = ''
}) => {
  const { values, errors, touched, setValue, setTouched } = useForm();

  const value = values[name];
  const error = errors[name] || '';
  const isTouched = touched[name] || false;

  const handleChange = (newValue: any) => {
    setValue(name, newValue);
  };

  const handleBlur = () => {
    setTouched(name, true);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {children({
        value,
        error,
        touched: isTouched,
        onChange: handleChange,
        onBlur: handleBlur
      })}
    </div>
  );
};

export default FormField;

