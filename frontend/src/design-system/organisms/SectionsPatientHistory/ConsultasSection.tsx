import React from 'react';
import styles from './SectionsPatientHistory.module.scss';

type Consulta = {
  id: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  notasMedico: string;
};

type Props = {
  consultas: Consulta[];
};

export const ConsultasSection: React.FC<Props> = ({ consultas }) => {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Historial de Consultas</h2>
        <span className={styles.badge}>Consultas</span>
      </div>

      <div>
        {consultas.map((c) => (
          <div key={c.id} className={styles.consultaItem}>
            <div className={styles.consultaHeader}>
              <span className={styles.consultaFecha}>{c.fecha}</span>
              <span className={styles.consultaMotivo}>{c.motivo}</span>
            </div>
            <div className={styles.consultaDetails}>
              <div>
                <strong>Diagnóstico:</strong> {c.diagnostico}
              </div>
              <div>
                <strong>Tratamiento:</strong> {c.tratamiento}
              </div>
              <div>
                <strong>Notas del médico:</strong> {c.notasMedico}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
