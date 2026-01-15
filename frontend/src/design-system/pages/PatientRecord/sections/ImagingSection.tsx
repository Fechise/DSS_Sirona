import React from 'react';
import styles from '../PatientRecordPage.module.scss';

type Imagen = {
  estudio: string;
  fecha: string;
  impresion: string;
};

type ImagenesSectionProps = {
  imagenes: Imagen[];
};

export const ImagingSection: React.FC<ImagenesSectionProps> = ({ imagenes }) => {
  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Imágenes</h2>
      </div>
      {imagenes.map((img, idx) => (
        <div className={styles.field} key={idx}>
          <label>
            {img.estudio} ({img.fecha})
          </label>
          <div className={styles.fieldValue}>{img.impresion}</div>
        </div>
      ))}
    </div>
  );
};
