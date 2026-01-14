import React from 'react';
import styles from './SectionsPatientHistory.module.scss';

type Props = {
  antecedentesFamiliares: string[];
  antecedentesPersonales?: string[];
};

export const AntecedentesSection: React.FC<Props> = ({ antecedentesFamiliares, antecedentesPersonales = [] }) => {
  const hasPersonales = antecedentesPersonales && antecedentesPersonales.length > 0;

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Antecedentes</h2>
        <span className={styles.badge}>Historia</span>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Familiares</span>
          <div className={styles.tagList}>
            {antecedentesFamiliares.map((a, idx) => (
              <span key={idx} className={styles.tag}>
                {a}
              </span>
            ))}
          </div>
        </div>

        {hasPersonales && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Personales</span>
            <div className={styles.tagList}>
              {antecedentesPersonales!.map((a, idx) => (
                <span key={idx} className={styles.tag}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
