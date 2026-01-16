import React, { useState, useEffect } from 'react';
import styles from './DoctorAppointmentsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
<<<<<<< HEAD
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
=======
import { Calendar, Clock, User, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Modal } from '../../atoms/Modal/Modal';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { useAuth } from '../../../contexts/AuthContext';
import { DoctorApiService, type AppointmentResponse } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

export const DoctorAppointmentsPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal para completar cita
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const loadAppointments = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await DoctorApiService.getMyAppointments(token, statusFilter || undefined);
      setAppointments(data);
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al cargar citas');
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    loadAppointments();
  }, [token, estadoFiltro]);
=======
  const handleCompleteAppointment = (appointment: AppointmentResponse) => {
    setSelectedAppointment(appointment);
    setCompletionNotes('');
    setShowCompleteModal(true);
  };

  const confirmCompleteAppointment = async () => {
    if (!token || !selectedAppointment) return;

    setCompleting(true);
    try {
      await DoctorApiService.completeAppointment(token, selectedAppointment.id, completionNotes || undefined);
      setShowCompleteModal(false);
      setSelectedAppointment(null);
      setCompletionNotes('');
      // Recargar citas
      await loadAppointments();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al completar la cita');
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [token, statusFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'Programada':
        return styles.statusProgramada;
      case 'Completada':
        return styles.statusCompletada;
      case 'Cancelada':
        return styles.statusCancelada;
      case 'No Asistió':
        return styles.statusNoAsistio;
      default:
        return '';
    }
  };
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb

  const columns: TableColumn<AppointmentResponse>[] = [
    {
      key: 'fecha',
<<<<<<< HEAD
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
=======
      label: 'Fecha',
      render: (value) => (
        <div className={styles.dateCell}>
          <Calendar size={16} />
          <span>{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: 'fecha',
      label: 'Hora',
      render: (value) => (
        <div className={styles.timeCell}>
          <Clock size={16} />
          <span>{formatTime(value)}</span>
        </div>
      ),
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    },
    {
      key: 'patientName',
      label: 'Paciente',
      render: (value) => (
<<<<<<< HEAD
        <div className={styles.patient}>
=======
        <div className={styles.patientCell}>
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
          <User size={16} />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'motivo',
      label: 'Motivo',
<<<<<<< HEAD
      render: (value) => (
        <div className={styles.motivo}>
          {value}
        </div>
      ),
=======
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
<<<<<<< HEAD
        <span className={`${styles.badge} ${styles[`badge${value.replace(/\s/g, '')}`]}`}>
=======
        <span className={`${styles.statusBadge} ${getStatusBadgeClass(value)}`}>
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
          {value}
        </span>
      ),
    },
    {
<<<<<<< HEAD
      key: 'notas',
      label: 'Notas',
      render: (value) => value ? (
        <div className={styles.notas}>{value}</div>
      ) : (
        <span className={styles.noNotas}>Sin notas</span>
=======
      key: 'patient_id',
      label: 'Acciones',
      render: (_, row) => (
        <div className={styles.actionsCell}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/medico/pacientes/${row.patient_id}/historial`)}
            startIcon={<FileText size={14} />}
          >
            Historial
          </Button>
          {row.estado === 'Programada' && (
            <Button
              variant="filled"
              color="tertiary"
              onClick={() => handleCompleteAppointment(row)}
              startIcon={<CheckCircle size={14} />}
            >
              Completar
            </Button>
          )}
        </div>
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
      ),
    },
  ];

  return (
    <Container>
<<<<<<< HEAD
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
          variant="outlined"
          onClick={loadAppointments}
          disabled={loading}
        >
          <RefreshCw size={16} />
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
=======
      <main className={styles.main}>
        <PageHeader
          title="Mis Citas"
          icon={<Calendar size={32} />}
        />

        <div className={styles.headerActions}>
          <p className={styles.subtitle}>
            Visualiza y gestiona tus citas programadas
          </p>
          <div className={styles.filters}>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todas las citas</option>
              <option value="Programada">Programadas</option>
              <option value="Completada">Completadas</option>
              <option value="Cancelada">Canceladas</option>
              <option value="No Asistió">No Asistió</option>
            </select>
            <Button
              variant="outlined"
              color="secondary"
              onClick={loadAppointments}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando citas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <p>No tienes citas {statusFilter ? `con estado "${statusFilter}"` : ''}</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <Table
              columns={columns}
              data={appointments}
              emptyMessage="No hay citas para mostrar"
              rowKey="id"
            />
          </div>
        )}

        {/* Modal para completar cita */}
        <Modal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          title="Completar Cita"
        >
          <div className={styles.completeModalContent}>
            {selectedAppointment && (
              <>
                <p className={styles.modalInfo}>
                  ¿Deseas marcar como completada la cita con <strong>{selectedAppointment.patientName}</strong>?
                </p>
                <div className={styles.notesField}>
                  <label htmlFor="completionNotes">Notas de la consulta (opcional)</label>
                  <textarea
                    id="completionNotes"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Agregue observaciones o notas sobre la consulta..."
                    rows={4}
                  />
                </div>
                <div className={styles.modalActions}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setShowCompleteModal(false)}
                    disabled={completing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="filled"
                    color="tertiary"
                    onClick={confirmCompleteAppointment}
                    disabled={completing}
                    startIcon={<CheckCircle size={16} />}
                  >
                    {completing ? 'Completando...' : 'Confirmar'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </main>
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    </Container>
  );
};
