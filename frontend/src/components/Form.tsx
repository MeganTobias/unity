import React, { createContext, useContext, useState } from 'react';

interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  handleSubmit: (onSubmit: (values: Record<string, any>) => void) => (e: React.FormEvent) => void;
  resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

interface FormProps {
  children: React.ReactNode;
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => void;
  validationSchema?: (values: Record<string, any>) => Record<string, string>;
  className?: string;
}

const Form: React.FC<FormProps> = ({
  children,
  initialValues = {},
  onSubmit,
  validationSchema,
  className = ''
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const setError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const setTouched = (name: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: touched }));
  };

  const handleSubmit = (onSubmit: (values: Record<string, any>) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate form
      if (validationSchema) {
        const validationErrors = validationSchema(values);
        setErrors(validationErrors);
        
        if (Object.keys(validationErrors).length > 0) {
          return;
        }
      }
      
      onSubmit(values);
    };
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const contextValue: FormContextType = {
    values,
    errors,
    touched,
    setValue,
    setError,
    setTouched,
    handleSubmit,
    resetForm
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        className={className}
        onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
};

export default Form;

