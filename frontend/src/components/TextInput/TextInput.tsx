import styles from "./TextInput.module.css";

interface TextInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export default function TextInput({
  value,
  placeholder,
  onChange,
}: TextInputProps) {
  return (
    <input
      className={styles.input}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}