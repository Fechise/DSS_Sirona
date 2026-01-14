import React from 'react';
import styles from './SectionsPatientHistory.module.scss';

type Props = {
  tipoSangre: string;
  alergias: string[];
  condicionesCronicas: string[];
  medicamentosActuales: string[];
};

export const PersonalInfoSection: React.FC<Props> = ({
  tipoSangre,
  alergias,
  condicionesCronicas,
  medicamentosActuales,
}) => {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Información Personal Médica</h2>
        <span className={styles.badge}>Resumen</span>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Tipo de sangre</label>
          <div className={styles.infoValue}>
            <span className={styles.bloodType}>{tipoSangre}</span>
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Alergias</label>
          <div className={styles.tagList}>
            {alergias.map((a, i) => (
              <span key={i} className={`${styles.tag} ${styles.tagDanger}`}>{a}</span>
            ))}
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Condiciones crónicas</label>
          <div className={styles.tagList}>
            {condicionesCronicas.map((c, i) => (
              <span key={i} className={`${styles.tag} ${styles.tagWarning}`}>{c}</span>
            ))}
          </div>
        </div>

        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Medicamentos actuales</label>
          <ul>
            {medicamentosActuales.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
