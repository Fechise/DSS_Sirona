import React, { useState, useEffect } from 'react';
import styles from './DoctorAppointmentsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Calendar, RefreshCw, Clock, User } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { AppointmentApiService, type AppointmentResponse } from '../../../services/api';

export const DoctorAppointmentsPage: React.FC = () => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');

  const loadAppointments = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const data = await AppointmentApiService.getDoctorAppointments(token, estadoFiltro || undefined);
      setAppointments(data);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [token, estadoFiltro]);

  const columns: TableColumn<AppointmentResponse>[] = [
    {
      key: 'fecha',
      label: 'Fecha y Hora',
      render: (value) => {
        const fecha = new Date(value);
        return (
          <div className={styles.dateTime}>
            <div className={styles.date}>
              <Calendar size={16} />
              <span>{fecha.toLocaleDateString('es-ES', { 
                weekday: 'short', 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className={styles.time}>
              <Clock size={14} />
              <span>{fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'patientName',
      label: 'Paciente',
      render: (value) => (
        <div className={styles.patient}>
          <User size={16} />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'motivo',
      label: 'Motivo',
      render: (value) => (
        <div className={styles.motivo}>
          {value}
        </div>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <span className={`${styles.badge} ${styles[`badge${value.replace(/\s/g, '')}`]}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'notas',
      label: 'Notas',
      render: (value) => value ? (
        <div className={styles.notas}>{value}</div>
      ) : (
        <span className={styles.noNotas}>Sin notas</span>
      ),
    },
  ];

  return (
    <Container>
      <PageHeader
        title="Mis Citas Médicas"
        subtitle="Visualiza todas tus citas programadas y su estado"
        icon={<Calendar size={32} />}
      />

      <div className={styles.controls}>
        <div className={styles.filters}>
          <label htmlFor="estadoFilter">Filtrar por estado:</label>
          <select
            id="estadoFilter"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className={styles.select}
          >
            <option value="">Todos</option>
            <option value="Programada">Programada</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Completada">Completada</option>
            <option value="Cancelada">Cancelada</option>
            <option value="No Asistió">No Asistió</option>
          </select>
        </div>

        <Button
          variant="secondary"
          onClick={loadAppointments}
          disabled={loading}
          icon={<RefreshCw size={16} />}
        >
          Actualizar
        </Button>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <RefreshCw size={24} className={styles.spinner} />
          <p>Cargando citas...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className={styles.empty}>
          <Calendar size={48} />
          <p>No tienes citas {estadoFiltro && `en estado "${estadoFiltro}"`}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <Table
            data={appointments}
            columns={columns}
            emptyMessage="No hay citas disponibles"
          />
        </div>
      )}
    </Container>
  );
};
