import React, { useId } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isDuplicate?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  isDuplicate, 
  className = '', 
  ...props 
}) => {
  // ラベルと入力欄を関連付け、キーボード操作と読み上げに対応する。
  const generatedId = useId();
  const inputId = props.id || generatedId;
  return (
    <div className={`pedigree-field min-w-0 border-b border-r border-gray-400 ${className}`}>
      <label
        htmlFor={inputId}
        className={`block px-2 pt-1.5 text-sm leading-5 text-gray-700 lg:pt-1 lg:text-xs lg:leading-4 ${props.disabled ? 'opacity-60' : ''}`}
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        className={`block min-h-11 w-full min-w-0 bg-white/40 px-2 pb-1 text-base leading-6 transition-colors focus:bg-white lg:min-h-7 lg:text-sm ${
          isDuplicate ? 'text-blue-600 font-bold' : 'text-gray-900'
        } ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
  );
};
