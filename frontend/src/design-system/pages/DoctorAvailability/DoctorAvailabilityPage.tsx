<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AppointmentApiService, type DoctorAvailability, type CreateAvailabilityRequest } from '../../../services/api';
import styles from './DoctorAvailabilityPage.module.scss';
import { Calendar, Clock, Plus, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { Container } from '../../atoms/Container/Container';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { Button } from '../../atoms/Button/Button';
import { Modal } from '../../atoms/Modal/Modal';

export const DoctorAvailabilityPage: React.FC = () => {
  const { token, user } = useAuth();
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal para crear disponibilidad
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateAvailabilityRequest>({
    fecha: '',
    horaInicio: '08:00',
    horaFin: '17:00',
    duracionCita: 30
  });

  const fetchAvailabilities = async () => {
    if (!token || !user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await AppointmentApiService.getDoctorAvailability(token, user.id);
      // Ordenar por fecha
      const sorted = data.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      setAvailabilities(sorted);
    } catch (err: any) {
      console.error('Error al obtener disponibilidad:', err);
      setError(err.detail || 'Error al cargar la disponibilidad');
=======
import React, { useState, useEffect } from 'react';
import styles from './DoctorAvailabilityPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Calendar, Clock, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { Table, type TableColumn } from '../../molecules/Table/Table';
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
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
<<<<<<< HEAD
    if (user?.id) {
      fetchAvailabilities();
    }
  }, [token, user?.id]);

  const handleCreateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.id) return;

    // Validaciones
    if (!formData.fecha) {
      setError('Debe seleccionar una fecha');
      return;
    }

    // Validar que la fecha sea futura
    const selectedDate = new Date(formData.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('La fecha debe ser hoy o en el futuro');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await AppointmentApiService.createDoctorAvailability(token, user.id, formData);
      setSuccess('Disponibilidad creada exitosamente');
      setShowCreateModal(false);
=======
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
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
      setFormData({
        fecha: '',
        horaInicio: '08:00',
        horaFin: '17:00',
<<<<<<< HEAD
        duracionCita: 30
      });
      fetchAvailabilities();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error al crear disponibilidad:', err);
      setError(err.detail || 'Error al crear la disponibilidad');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isDatePast = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Generar fechas para la próxima semana
  const generateQuickDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  if (loading) {
    return (
      <Container>
        <div className={styles.loadingState}>
          <Loader size={48} className={styles.spinner} />
          <p>Cargando disponibilidad...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.page}>
        <PageHeader 
          title="Mi Disponibilidad" 
          icon={<Calendar size={32} />}
        />

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <div className={styles.headerActions}>
          <p className={styles.description}>
            Configure los días y horarios en los que está disponible para atender citas.
          </p>
          <Button 
            variant="filled" 
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Agregar Disponibilidad
          </Button>
        </div>

        <div className={styles.content}>
          {availabilities.length > 0 ? (
            <div className={styles.availabilityList}>
              {availabilities.map((av) => (
                <div 
                  key={av.id} 
                  className={`${styles.availabilityCard} ${isDatePast(av.fecha) ? styles.past : ''} ${!av.activo ? styles.inactive : ''}`}
                >
                  <div className={styles.dateSection}>
                    <Calendar size={24} />
                    <div>
                      <span className={styles.dateText}>{formatDate(av.fecha)}</span>
                      {isDatePast(av.fecha) && <span className={styles.pastBadge}>Pasado</span>}
                      {!av.activo && <span className={styles.inactiveBadge}>Inactivo</span>}
                    </div>
                  </div>
                  <div className={styles.timeSection}>
                    <Clock size={20} />
                    <span>{av.horaInicio} - {av.horaFin}</span>
                  </div>
                  <div className={styles.durationSection}>
                    <span className={styles.durationLabel}>Duración por cita:</span>
                    <span className={styles.durationValue}>{av.duracionCita} min</span>
                  </div>
                  <div className={styles.slotsInfo}>
                    {(() => {
                      const start = parseInt(av.horaInicio.split(':')[0]);
                      const end = parseInt(av.horaFin.split(':')[0]);
                      const hours = end - start;
                      const slots = Math.floor((hours * 60) / av.duracionCita);
                      return <span>{slots} citas disponibles</span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Calendar size={64} />
              <h3>No tiene disponibilidad configurada</h3>
              <p>Agregue horarios para que los pacientes puedan agendar citas con usted.</p>
              <Button 
                variant="filled" 
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Agregar Disponibilidad
              </Button>
            </div>
          )}
        </div>

        {/* Modal para crear disponibilidad */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Agregar Disponibilidad"
        >
          <form onSubmit={handleCreateAvailability} className={styles.createForm}>
            <div className={styles.formGroup}>
              <label>Fecha</label>
              <input
                type="date"
                className={styles.input}
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
              <div className={styles.quickDates}>
                {generateQuickDates().map((date) => (
                  <button
                    key={date}
                    type="button"
                    className={`${styles.quickDateBtn} ${formData.fecha === date ? styles.selected : ''}`}
                    onClick={() => setFormData({ ...formData, fecha: date })}
                  >
                    {new Date(date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.timeRow}>
              <div className={styles.formGroup}>
                <label>Hora Inicio</label>
                <input
                  type="time"
                  className={styles.input}
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hora Fin</label>
                <input
                  type="time"
                  className={styles.input}
                  value={formData.horaFin}
                  onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Duración por cita (minutos)</label>
              <select
                value={formData.duracionCita}
                onChange={(e) => setFormData({ ...formData, duracionCita: parseInt(e.target.value) })}
                className={styles.select}
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <Button 
                variant="outlined" 
                type="button"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="filled" 
                type="submit"
                disabled={creating}
              >
                {creating ? <Loader size={18} className={styles.spinner} /> : <Plus size={18} />}
                {creating ? 'Creando...' : 'Crear Disponibilidad'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
=======
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
        <span className={`${styles.statusBadge} ${value ? styles.activo : styles.inactivo}`}>
          {value ? 'Disponible' : 'No disponible'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_, row) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            color={row.activo ? 'secondary' : 'primary'}
            onClick={() => handleToggle(row.id)}
            title={row.activo ? 'Desactivar' : 'Activar'}
          >
            {row.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </Button>
          <Button
            variant="ghost"
            color="danger"
            onClick={() => handleDelete(row.id)}
            title="Eliminar"
          >
            <Trash2 size={20} />
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
          icon={<Calendar size={32} />}
        />

        <div className={styles.headerActions}>
          <p className={styles.subtitle}>
            Configura los días y horarios en los que estás disponible para citas
          </p>
          <div className={styles.buttons}>
            <Button
              variant="filled"
              color="primary"
              onClick={() => setShowForm(!showForm)}
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
          </div>
        </div>

        {/* Mensajes */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Formulario de nueva disponibilidad */}
        {showForm && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <h3>Nueva Disponibilidad</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <Input
                  id="availability-fecha"
                  label="Fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleFormChange('fecha')}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="availability-horaInicio"
                  label="Hora Inicio"
                  type="time"
                  value={formData.horaInicio}
                  onChange={handleFormChange('horaInicio')}
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="availability-horaFin"
                  label="Hora Fin"
                  type="time"
                  value={formData.horaFin}
                  onChange={handleFormChange('horaFin')}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Duración de Cita</label>
                <select
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
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => setShowForm(false)}
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
                {submitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        )}

        {/* Tabla de disponibilidad */}
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando disponibilidad...</p>
          </div>
        ) : availabilities.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <p>No tienes horarios configurados</p>
            <span className={styles.hint}>
              Agrega tu disponibilidad para que los pacientes puedan agendar citas
            </span>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <Table
              columns={columns}
              data={availabilities}
              emptyMessage="No hay disponibilidad configurada"
              rowKey="id"
            />
          </div>
        )}
      </main>
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    </Container>
  );
};
