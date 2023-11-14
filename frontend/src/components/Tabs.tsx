import React, { useState } from 'react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  const variantClasses = {
    default: 'border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700',
    pills: 'rounded-md hover:bg-gray-100',
    underline: 'border-b-2 border-transparent hover:border-gray-300'
  };

  const activeClasses = {
    default: 'border-blue-500 text-blue-600',
    pills: 'bg-blue-100 text-blue-700',
    underline: 'border-blue-500 text-blue-600'
  };

  const tabListClasses = {
    default: 'border-b border-gray-200',
    pills: 'space-x-1',
    underline: 'border-b border-gray-200'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`flex ${tabListClasses[variant]}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`
              ${sizeClasses[size]}
              font-medium
              ${variantClasses[variant]}
              ${activeTab === tab.id ? activeClasses[variant] : 'text-gray-500'}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              transition-colors duration-200
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;

