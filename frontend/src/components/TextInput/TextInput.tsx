import React from "react";
import "./TextInput.module.css"; 

interface TextInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  placeholder,
  onChange,
}) => {
  return (
    <div className="input-container">
      <label className="input-label">{label}</label>

      <input
        className="text-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TextInput;