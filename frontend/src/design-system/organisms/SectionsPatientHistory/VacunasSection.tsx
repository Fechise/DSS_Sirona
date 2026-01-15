import React from 'react';
import styles from './SectionsPatientHistory.module.scss';

type Vacuna = {
  nombre: string;
  fecha: string;
  proximaDosis?: string;
};

type Props = {
  vacunas: Vacuna[];
};

export const VacunasSection: React.FC<Props> = ({ vacunas }) => {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Vacunas</h2>
        <span className={styles.badge}>Inmunización</span>
      </div>

      <div className={styles.vaccineGrid}>
        {vacunas.map((v, idx) => (
          <div key={idx} className={styles.vaccineItem}>
            <div className={styles.infoValue}>
              <strong>{v.nombre}</strong>
            </div>
            <div className={styles.infoValue}>Fecha: {v.fecha}</div>
            {v.proximaDosis && (
              <div className={styles.infoValue}>Próxima dosis: {v.proximaDosis}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
