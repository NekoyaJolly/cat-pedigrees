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
    <div className={`relative border-b border-r border-gray-400 ${className}`}>
      <input
        {...props}
        id={inputId}
        className={`block h-11 px-2 pb-1 pt-4 w-full text-[13px] outline-none bg-white/40 focus:bg-white transition-colors ${
          isDuplicate ? 'text-blue-600 font-bold' : 'text-gray-900'
        } ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      <label 
        htmlFor={inputId}
        className={`absolute text-[10px] leading-3 text-gray-600 top-1 left-2
        pointer-events-none truncate max-w-[calc(100%-16px)]
        ${props.disabled ? 'opacity-60' : ''}`}
      >
        {label}
      </label>
    </div>
  );
};
