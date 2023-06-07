import React from 'react';
import Button from './Button';

interface FormFieldArrayProps {
  name: string;
  children: (props: {
    fields: any[];
    add: () => void;
    remove: (index: number) => void;
    move: (from: number, to: number) => void;
  }) => React.ReactNode;
  initialValue?: any[];
  minItems?: number;
  maxItems?: number;
  addButtonText?: string;
  removeButtonText?: string;
  className?: string;
}

const FormFieldArray: React.FC<FormFieldArrayProps> = ({
  name,
  children,
  initialValue = [],
  minItems = 0,
  maxItems = 10,
  addButtonText = 'Add Item',
  removeButtonText = 'Remove',
  className = ''
}) => {
  const [fields, setFields] = React.useState<any[]>(initialValue);

  const add = () => {
    if (fields.length < maxItems) {
      setFields(prev => [...prev, {}]);
    }
  };

  const remove = (index: number) => {
    if (fields.length > minItems) {
      setFields(prev => prev.filter((_, i) => i !== index));
    }
  };

  const move = (from: number, to: number) => {
    if (from >= 0 && from < fields.length && to >= 0 && to < fields.length) {
      const newFields = [...fields];
      const [movedField] = newFields.splice(from, 1);
      newFields.splice(to, 0, movedField);
      setFields(newFields);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {children({ fields, add, remove, move })}
      
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={fields.length >= maxItems}
        >
          {addButtonText}
        </Button>
        
        {fields.length > minItems && (
          <span className="text-sm text-gray-500">
            {fields.length} item{fields.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default FormFieldArray;
