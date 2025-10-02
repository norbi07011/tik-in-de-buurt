import React from 'react';

interface AccessibleEditableDetailItemProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  isEditing: boolean;
  name: string;
  onUpdate: (name: string, value: any) => void;
  type?: string;
  required?: boolean;
  children?: React.ReactNode;
}

const AccessibleEditableDetailItem: React.FC<AccessibleEditableDetailItemProps> = ({ 
  icon, 
  label, 
  value, 
  isEditing, 
  name, 
  onUpdate, 
  type = 'text', 
  required = false,
  children 
}) => {
  if (!isEditing && !value) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdate(name, e.target.value);
  };

  const inputId = `${name}-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex items-start gap-3 py-3 border-b glass-card-divider last:border-b-0">
      {icon && (
        <div 
          className="text-[var(--primary)] flex-shrink-0 mt-1" 
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="flex-1 flex justify-between items-center">
        <label 
          htmlFor={inputId}
          className="text-[var(--text-secondary)] text-sm"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
        
        {isEditing ? (
          <div className="w-1/2">
            {children || (
              <input
                id={inputId}
                type={type}
                value={value as string || ''}
                onChange={handleChange}
                required={required}
                {...(required ? { 'aria-required': 'true' } : {})}
                aria-describedby={errorId}
                aria-label={`Edit ${label}`}
                title={`Enter ${label.toLowerCase()}${required ? ' (required)' : ''}`}
                className="w-full text-right bg-transparent text-[var(--text-primary)] font-semibold border-b border-dashed border-[var(--border-color)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            )}
          </div>
        ) : (
          <span 
            className="text-[var(--text-primary)] font-semibold text-right"
            aria-label={`${label}: ${value}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
};

export default AccessibleEditableDetailItem;