import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  variant?: 'default' | 'bordered' | 'flush';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = (itemId: string) => {
    if (allowMultiple) {
      setOpenItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setOpenItems(prev => 
        prev.includes(itemId) ? [] : [itemId]
      );
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'border border-gray-200 rounded-lg',
    bordered: 'border border-gray-200 rounded-lg divide-y divide-gray-200',
    flush: 'border-0'
  };

  const itemClasses = {
    default: 'border-b border-gray-200 last:border-b-0',
    bordered: '',
    flush: 'border-b border-gray-200 last:border-b-0'
  };

  return (
    <div className={`w-full ${variantClasses[variant]} ${className}`}>
      {items.map((item, index) => {
        const isOpen = openItems.includes(item.id);
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className={itemClasses[variant]}>
            <button
              onClick={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
              className={`
                w-full px-4 py-3 text-left
                ${sizeClasses[size]}
                font-medium
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors duration-200
                flex items-center justify-between
              `}
            >
              <span>{item.title}</span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
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
            </button>
            
            {isOpen && (
              <div className="px-4 pb-3">
                <div className={`${sizeClasses[size]} text-gray-700`}>
                  {item.content}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;

