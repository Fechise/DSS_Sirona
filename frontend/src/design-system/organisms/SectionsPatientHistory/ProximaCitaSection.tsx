import React from 'react';
import styles from './SectionsPatientHistory.module.scss';

type Cita = {
  fecha: string; // ISO o legible
  motivo: string;
  doctor: string;
  ubicacion?: string;
};

type Props = {
  proximaCita?: Cita | null;
};

export const ProximaCitaSection: React.FC<Props> = ({ proximaCita }) => {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Próxima Cita</h2>
        <span className={styles.badge}>Agenda</span>
      </div>

      {proximaCita ? (
        <div className={styles.appointmentCard}>
          <div className={styles.appointmentDate}>{proximaCita.fecha}</div>
          <div className={styles.appointmentInfo}>Motivo: {proximaCita.motivo}</div>
          <div className={styles.appointmentInfo}>Doctor: {proximaCita.doctor}</div>
          {proximaCita.ubicacion && (
            <div className={styles.appointmentInfo}>Ubicación: {proximaCita.ubicacion}</div>
          )}
        </div>
      ) : (
        <div className={styles.infoValue}>No hay próxima cita programada.</div>
      )}
    </section>
  );
};
