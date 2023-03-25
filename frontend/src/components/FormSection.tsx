import React from 'react';

interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  children,
  title,
  description,
  collapsible = false,
  defaultCollapsed = false,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapsed = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="border-b border-gray-200 pb-4">
          <div
            className={`flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
            onClick={toggleCollapsed}
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            
            {collapsible && (
              <svg
                className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </div>
      )}
      
      {(!collapsible || !isCollapsed) && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default FormSection;
