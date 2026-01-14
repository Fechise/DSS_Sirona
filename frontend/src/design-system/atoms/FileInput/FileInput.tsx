import React, { useRef } from 'react';
import styles from './FileInput.module.scss';
import { Upload } from 'lucide-react';

type FileInputProps = {
  id: string;
  label: string;
  accept?: string;
  capture?: boolean | 'user' | 'environment';
  onChange: (file: File | null) => void;
  value: File | null;
  hint?: string;
  icon?: React.ReactNode;
  required?: boolean;
};

export const FileInput: React.FC<FileInputProps> = ({
  id,
  label,
  accept,
  capture,
  onChange,
  value,
  hint,
  icon,
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {icon && <span className={styles.labelIcon}>{icon}</span>}
          {label}
        </label>
      )}
      
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        capture={capture}
        onChange={handleChange}
        className={styles.hiddenInput}
        required={required}
      />

      <button
        type="button"
        onClick={handleClick}
        className={styles.selectButton}
      >
        <Upload size={18} />
        <span>{value ? 'Cambiar archivo' : 'Seleccionar archivo'}</span>
      </button>

      {value && (
        <div className={styles.fileName}>
          <span className={styles.fileIcon}>📄</span>
          <span className={styles.fileText}>{value.name}</span>
        </div>
      )}

      {!value && (
        <div className={styles.placeholder}>
          No se eligió ningún archivo
        </div>
      )}

      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
};
