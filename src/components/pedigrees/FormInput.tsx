import React, { useId } from 'react';
import type { PedigreeFieldSize } from '@/lib/pedigree-input-layout';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isDuplicate?: boolean;
  fieldSize?: PedigreeFieldSize;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  isDuplicate, 
  fieldSize = 'name',
  className = '', 
  ...props 
}) => {
  // 項目名は空欄の中に表示し、読み上げ用のラベルは常に関連付ける。
  const generatedId = useId();
  const inputId = props.id || generatedId;
  return (
    <div className={`pedigree-field pedigree-field--${fieldSize} ${className}`}>
      <label
        htmlFor={inputId}
        className="sr-only"
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        autoComplete={props.autoComplete ?? 'off'}
        placeholder={props.placeholder ?? label}
        className={`block w-full min-w-0 bg-white/40 px-2 text-base transition-colors focus:bg-white lg:text-sm ${
          isDuplicate ? 'text-blue-600 font-bold' : 'text-gray-900'
        } ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
  );
};
