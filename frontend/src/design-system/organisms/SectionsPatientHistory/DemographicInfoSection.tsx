import React from 'react';
import styles from './SectionsPatientHistory.module.scss';

type Props = {
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  genero: string | null;
  estadoCivil: string | null;
  ocupacion: string | null;
};

export const DemographicInfoSection: React.FC<Props> = ({
  direccion,
  ciudad,
  pais,
  genero,
  estadoCivil,
  ocupacion,
}) => {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Datos Demográficos</h2>
        <span className={styles.badge}>Información Personal</span>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Género</label>
          <div className={styles.infoValue}>
            {genero || 'No especificado'}
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Estado Civil</label>
          <div className={styles.infoValue}>
            {estadoCivil || 'No especificado'}
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Ocupación</label>
          <div className={styles.infoValue}>
            {ocupacion || 'No especificada'}
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Dirección</label>
          <div className={styles.infoValue}>
            {direccion || 'No especificada'}
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Ciudad</label>
          <div className={styles.infoValue}>
            {ciudad || 'No especificada'}
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>País</label>
          <div className={styles.infoValue}>
            {pais || 'No especificado'}
          </div>
        </div>
      </div>
    </section>
  );
};
