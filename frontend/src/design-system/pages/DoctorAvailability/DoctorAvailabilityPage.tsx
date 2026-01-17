import React, { useState, useEffect } from 'react';
import styles from './DoctorAvailabilityPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Calendar, Clock, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { Badge } from '../../atoms/Badge/Badge';
import { Modal } from '../../atoms/Modal/Modal';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import { useAuth } from '../../../contexts/AuthContext';
import { DoctorApiService, type DoctorAvailability } from '../../../services/api';

export const DoctorAvailabilityPage: React.FC = () => {
  const { token } = useAuth();
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fecha: '',
    horaInicio: '08:00',
    horaFin: '17:00',
    duracionCita: 30,
  });

  const loadAvailabilities = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await DoctorApiService.getMyAvailability(token);
      setAvailabilities(data);
    } catch (err: any) {
      setError(err?.detail || 'Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailabilities();
  }, [token]);

  const handleFormChange = (field: string) => (
    value: string
  ) => {
    const finalValue = field === 'duracionCita' ? parseInt(value) : value;
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
  };

  const handleSelectChange = (field: string) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = field === 'duracionCita' ? parseInt(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await DoctorApiService.createMyAvailability(token, formData);
      setSuccess('Disponibilidad creada exitosamente');
      setShowForm(false);
      setFormData({
        fecha: '',
        horaInicio: '08:00',
        horaFin: '17:00',
        duracionCita: 30,
      });
      loadAvailabilities();
    } catch (err: any) {
      setError(err?.detail || 'Error al crear disponibilidad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (!token) return;

    try {
      await DoctorApiService.toggleMyAvailability(token, id);
      loadAvailabilities();
    } catch (err: any) {
      setError(err?.detail || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm('¿Estás seguro de eliminar esta disponibilidad?')) return;

    try {
      await DoctorApiService.deleteMyAvailability(token, id);
      setSuccess('Disponibilidad eliminada');
      loadAvailabilities();
    } catch (err: any) {
      setError(err?.detail || 'Error al eliminar disponibilidad');
    }
  };

  const columns: TableColumn<DoctorAvailability>[] = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (value) => (
        <div className={styles.fechaCell}>
          <Calendar size={16} />
          <span>{new Date(value + 'T00:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
      ),
    },
    {
      key: 'horaInicio',
      label: 'Horario',
      render: (_, row) => (
        <div className={styles.horarioCell}>
          <Clock size={16} />
          <span>{row.horaInicio} - {row.horaFin}</span>
        </div>
      ),
    },
    {
      key: 'duracionCita',
      label: 'Duración Cita',
      render: (value) => `${value} minutos`,
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (value) => (
        <Badge
          value={value ? 'Activo' : 'Inactivo'}
          type="status"
        />
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      align: 'center',
      render: (_, row) => (
        <div className={styles.actions}>
          <Button
            variant="outlined"
            color={row.activo ? 'secondary' : 'primary'}
            onClick={() => handleToggle(row.id)}
            startIcon={row.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          >
            {row.activo ? 'Desactivar' : 'Activar'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDelete(row.id)}
            startIcon={<Trash2 size={16} />}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Mi Disponibilidad"
          icon={<Calendar size={28} />}
          subtitle="Configura los días y horarios en los que estás disponible para citas"
        />

        <TableToolbar
          right={
            <>
              <Button
                variant="filled"
                color="primary"
                onClick={() => setShowForm(true)}
                startIcon={<Plus size={16} />}
              >
                Agregar Disponibilidad
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={loadAvailabilities}
                disabled={loading}
                startIcon={<RefreshCw size={16} />}
              >
                Actualizar
              </Button>
            </>
          }
        />

        {/* Mensajes */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Modal de nueva disponibilidad */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setFormData({
              fecha: '',
              horaInicio: '08:00',
              horaFin: '17:00',
              duracionCita: 30,
            });
          }}
          title="Agregar Nueva Disponibilidad"
          maxWidth="1400px"
        >
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <Input
                  id="availability-fecha"
                  label="Fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleFormChange('fecha')}
                  min={new Date().toISOString().split('T')[0]}
                  icon={<Calendar size={16} />}
                  focusColor="var(--primary-color)"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="availability-horaInicio"
                  label="Hora Inicio"
                  type="time"
                  value={formData.horaInicio}
                  onChange={handleFormChange('horaInicio')}
                  icon={<Clock size={16} />}
                  focusColor="var(--primary-color)"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="availability-horaFin"
                  label="Hora Fin"
                  type="time"
                  value={formData.horaFin}
                  onChange={handleFormChange('horaFin')}
                  icon={<Clock size={16} />}
                  focusColor="var(--primary-color)"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="duration-select" className={styles.label}>
                  <Clock size={16} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
                  Duración de Cita
                </label>
                <select
                  id="duration-select"
                  className={styles.select}
                  value={formData.duracionCita}
                  onChange={handleSelectChange('duracionCita')}
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    fecha: '',
                    horaInicio: '08:00',
                    horaFin: '17:00',
                    duracionCita: 30,
                  });
                }}
                startIcon={<X size={16} />}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="filled"
                color="primary"
                disabled={submitting}
                startIcon={submitting ? <Loader2 size={16} className={styles.spinner} /> : <Plus size={16} />}
              >
                {submitting ? 'Guardando...' : 'Agregar'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Tabla de disponibilidad */}
        {loading ? (
          <LoadingSpinner
            variant="bouncing-role"
            role="Médico"
            message="Cargando disponibilidad..."
            size="large"
          />
        ) : availabilities.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <p>No tienes horarios configurados</p>
            <span className={styles.hint}>
              Agrega tu disponibilidad para que los pacientes puedan agendar citas
            </span>
          </div>
        ) : (
          <Table
            columns={columns}
            data={availabilities}
            emptyMessage="No hay disponibilidad configurada"
            rowKey="id"
          />
        )}
      </main>
    </Container>
  );
};
