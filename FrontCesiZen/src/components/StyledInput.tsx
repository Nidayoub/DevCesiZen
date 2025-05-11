'use client';

import React, { InputHTMLAttributes } from 'react';

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const StyledInput: React.FC<StyledInputProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-900 mb-1">
        {label}
      </label>
      <div className="mt-1">
        <input
          className={`appearance-none block w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-500 text-gray-900 font-medium focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};

export default StyledInput; 