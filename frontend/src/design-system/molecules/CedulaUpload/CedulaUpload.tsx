import React from 'react';
import { Upload, Camera } from 'lucide-react';
import styles from './CedulaUpload.module.scss';

type Props = {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  error?: string;
  disabled?: boolean;
};

export const CedulaUpload: React.FC<Props> = ({ 
  previewUrl, 
  onFileSelect, 
  error,
  disabled = false 
}) => {
  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;
    onFileSelect(file);
  };

  return (
    <div className={styles.uploadColumn}>
      <div className={styles.uploadSection}>
        <label className={styles.uploadLabel} htmlFor="cedulaImage">
          <span className={styles.uploadText}>Imagen de cédula</span>
          <span className={styles.hint}>Sube o captura una foto</span>
        </label>

        <div className={styles.uploadControls}>
          <label className={styles.uploadButton}>
            <Upload size={18} />
            <span>Subir imagen</span>
            <input
              id="cedulaImage"
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              disabled={disabled}
              hidden
            />
          </label>
          <label className={styles.captureButton}>
            <Camera size={18} />
            <span>Capturar</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFile(e.target.files?.[0])}
              disabled={disabled}
              hidden
            />
          </label>
        </div>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {previewUrl && (
          <div className={styles.preview}>
            <img src={previewUrl} alt="Previsualización de cédula" />
          </div>
        )}
        
        {!previewUrl && (
          <div className={styles.previewPlaceholder}>
            <Upload size={32} />
            <p>La imagen aparecerá aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};
