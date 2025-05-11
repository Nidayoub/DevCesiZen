'use client';

import React, { SelectHTMLAttributes } from 'react';

interface StyledSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const StyledSelect: React.FC<StyledSelectProps> = ({ 
  label, 
  options, 
  className = '', 
  ...props 
}) => {
  return (
    <div>
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-900 mb-1">
          {label}
        </label>
      )}
      <select
        className={`block w-full pl-3 pr-10 py-2 text-gray-900 font-medium border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-900 font-medium">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StyledSelect; 