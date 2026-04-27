import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isDuplicate?: boolean;
  labelWidth?: string; // Optional class for label width, e.g., 'w-16' or 'w-1/3'
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  isDuplicate, 
  labelWidth, // No longer needed for floating label
  className = '', 
  ...props 
}) => {
  // Ensure placeholder is at least a space so peer-placeholder-shown works
  const passedPlaceholder = props.placeholder;
  const actualPlaceholder = passedPlaceholder && passedPlaceholder !== " " ? passedPlaceholder : " ";

  return (
    <div className={`relative border-b border-r border-gray-400 ${className}`}>
      <input
        {...props}
        placeholder={actualPlaceholder}
        className={`block px-2 pb-1 pt-4 w-full text-xs outline-none bg-white/40 focus:bg-white transition-colors peer ${
          isDuplicate ? 'text-blue-600 font-bold' : 'text-gray-900'
        } ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      <label 
        className={`absolute text-gray-700 duration-200 transform -translate-y-4 scale-[0.75] top-2.5 z-10 origin-[0] left-2
        bg-white/85 backdrop-blur-sm px-1 rounded-sm
        peer-focus:text-blue-700 peer-focus:font-bold
        peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:bg-transparent peer-placeholder-shown:backdrop-blur-none
        peer-focus:scale-[0.75] peer-focus:-translate-y-4 peer-focus:bg-white/85 peer-focus:backdrop-blur-sm
        pointer-events-none truncate max-w-[calc(100%-16px)]
        ${props.disabled ? 'opacity-60' : ''}`}
      >
        {label}
      </label>
    </div>
  );
};
