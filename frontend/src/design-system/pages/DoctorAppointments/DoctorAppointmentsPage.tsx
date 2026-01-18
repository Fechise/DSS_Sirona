import React, { useState, useEffect } from 'react';
import styles from './DoctorAppointmentsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Calendar, Clock, User, RefreshCw, FileText, CheckCircle, X } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Badge } from '../../atoms/Badge/Badge';
import { Modal } from '../../atoms/Modal/Modal';
import { NoResults } from '../../molecules/NoResults/NoResults';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import { FilterSelect } from '../../atoms/FilterSelect/FilterSelect';
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
    } finally {
      setLoading(false);
    }
  };

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


  const columns: TableColumn<AppointmentResponse>[] = [
    {
      key: 'fecha',
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
    },
    {
      key: 'patientName',
      label: 'Paciente',
      render: (value) => (
        <div className={styles.patientCell}>
          <User size={16} />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'motivo',
      label: 'Motivo',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => <Badge value={value} type="status" />,
    },
    {
      key: 'patient_id',
      label: 'Acciones',
      align: 'center',
      render: (_, row) => (
        <div className={styles.actionsCell}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/medico/pacientes/${row.patient_id}/historial`)}
            startIcon={<FileText size={16} />}
          >
            Historial
          </Button>
          {row.estado === 'Programada' && (
            <Button
              variant="filled"
              color="tertiary"
              onClick={() => handleCompleteAppointment(row)}
              startIcon={<CheckCircle size={16} />}
            >
              Completar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Mis Citas"
          icon={<Calendar size={28} />}
          subtitle="Visualiza y gestiona tus citas programadas"
        />

        <TableToolbar
          left={
            <FilterSelect
              id="status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Todas las citas"
              themeColor="var(--role-doctor-color)"
              options={[
                { value: '', label: 'Todas las citas' },
                { value: 'Programada', label: 'Programadas' },
                { value: 'Completada', label: 'Completadas' },
                { value: 'Cancelada', label: 'Canceladas' },
                { value: 'No Asistió', label: 'No Asistió' },
              ]}
            />
          }
          right={
            <Button
              variant="filled"
              color="secondary"
              onClick={loadAppointments}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          }
        />

        {error && <div className={styles.errorMessage}>{error}</div>}

        {loading ? (
          <LoadingSpinner
            variant="bouncing-role"
            role="Médico"
            message="Cargando citas..."
            size="large"
          />
        ) : appointments.length === 0 ? (
          <NoResults
            title={`No tienes citas${statusFilter ? ` con estado "${statusFilter}"` : ''}`}
            icon={<Calendar size={48} />}
          />
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
                    startIcon={<X size={16} />}
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
    </Container>
  );
};
