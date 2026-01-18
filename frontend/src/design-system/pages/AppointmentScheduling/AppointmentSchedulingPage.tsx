import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, X, User, Stethoscope, Clock } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Badge } from '../../atoms/Badge/Badge';
import { Container } from '../../atoms/Container/Container';
import { SectionHeader } from '../../atoms/SectionHeader/SectionHeader';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { Table } from '../../molecules/Table/Table';
import { Modal } from '../../atoms/Modal/Modal';
import { NoResults } from '../../molecules/NoResults/NoResults';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { PatientApiService, AppointmentApiService } from '../../../services/api';
import styles from './AppointmentSchedulingPage.module.scss';

type Patient = {
  id: string;
  name: string;
  cedula: string;
  phone: string;
};

type Doctor = {
  id: string;
  name: string;
  specialization: string;
};

type Appointment = {
  id: string;
  patient_id: string;
  patientName: string;
  doctor_id: string;
  doctorName: string;
  fecha: string;
  motivo: string;
  estado: string;
  notas: string | null | undefined;
  created_at: string;
  updated_at: string;
};

type AppointmentForm = {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
};

export const AppointmentSchedulingPage: React.FC = () => {
  const { token, user } = useAuth();
  const toast = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppointmentForm>({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
  });
  
  // Estados para consultar disponibilidad
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availability, setAvailability] = useState<string[]>([]);

  // Load real data from API
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Cargar pacientes, médicos y citas en paralelo
        const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
          PatientApiService.getPatientsList(token),
          AppointmentApiService.getDoctors(token),
          AppointmentApiService.getAppointments(token)
        ]);

        // Mapear pacientes
        setPatients(patientsRes.patients.map(p => ({
          id: p.id,
          name: p.fullName,
          cedula: p.cedula,
          phone: '' // El endpoint no devuelve teléfono actualmente
        })));

        // Mapear médicos
        setDoctors(doctorsRes.map(d => ({
          id: d.id,
          name: d.fullName,
          specialization: d.especialidad || ''
        })));

        // Mapear citas
        setAppointments(appointmentsRes.map(apt => ({
          id: apt.id,
          patient_id: apt.patient_id,
          patientName: apt.patientName,
          doctor_id: apt.doctor_id,
          doctorName: apt.doctorName,
          fecha: apt.fecha,
          motivo: apt.motivo,
          estado: apt.estado,
          notas: apt.notas ?? null,
          created_at: apt.created_at,
          updated_at: apt.updated_at
        })));
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos de citas');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleAddAppointment = async () => {
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!token) {
      toast.error('No se encontró token de autenticación');
      return;
    }

    const patient = patients.find((p) => p.id === formData.patientId);
    const doctor = doctors.find((d) => d.id === formData.doctorId);

    if (!patient || !doctor) {
      toast.error('Paciente o médico no encontrado');
      return;
    }

    try {
      if (editingId) {
        // Update existing appointment - solo fecha y hora
        await AppointmentApiService.updateAppointment(token, editingId, {
          fecha: `${formData.date}T${formData.time}:00`
        });
        
        // Recargar las citas para obtener los datos actualizados
        const appointmentsRes = await AppointmentApiService.getAppointments(token);
        setAppointments(appointmentsRes.map(apt => ({
          id: apt.id,
          patient_id: apt.patient_id,
          patientName: apt.patientName,
          doctor_id: apt.doctor_id,
          doctorName: apt.doctorName,
          fecha: apt.fecha,
          motivo: apt.motivo,
          estado: apt.estado,
          notas: apt.notas ?? null,
          created_at: apt.created_at,
          updated_at: apt.updated_at
        })));
        
        setEditingId(null);
      } else {
        // Create new appointment via API
        const newApt = await AppointmentApiService.createAppointment(token, {
          patient_id: formData.patientId,
          doctor_id: formData.doctorId,
          fecha: `${formData.date}T${formData.time}:00`,
          motivo: 'Consulta médica'
        });
        
        const newAppointment: Appointment = {
          id: newApt.id,
          patient_id: newApt.patient_id,
          patientName: newApt.patientName,
          doctor_id: newApt.doctor_id,
          doctorName: newApt.doctorName,
          fecha: newApt.fecha,
          motivo: newApt.motivo,
          estado: newApt.estado,
          notas: newApt.notas ?? null,
          created_at: newApt.created_at,
          updated_at: newApt.updated_at
        };
        setAppointments([...appointments, newAppointment]);
      }

      toast.success(editingId ? 'Cita actualizada exitosamente' : 'Cita creada exitosamente');
      setFormData({ patientId: '', doctorId: '', date: '', time: '' });
      setShowForm(false);
      setError(null);
    } catch (err: unknown) {
      console.error('Error saving appointment:', err);
      const errorObj = err as { detail?: string };
      toast.error(errorObj.detail || 'Error al guardar la cita');
    }
  };

  const handleEditAppointment = (apt: Appointment) => {
    const [date, timeWithSeconds] = apt.fecha.split('T');
    const time = timeWithSeconds?.substring(0, 5) || '';
    
    setFormData({
      patientId: apt.patient_id,
      doctorId: apt.doctor_id,
      date: date,
      time: time,
    });
    setEditingId(apt.id);
    setShowForm(true);
  };

  const handleCancelAppointment = async (id: string) => {
    if (!token) {
      toast.error('No se encontró token de autenticación');
      return;
    }

    try {
      // Cambiar el estado a "Cancelada" en lugar de eliminar
      await AppointmentApiService.updateAppointment(token, id, {
        estado: 'Cancelada'
      });
      
      // Actualizar el estado local
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, estado: 'Cancelada' } : apt
      ));
      toast.success('Cita cancelada exitosamente');
    } catch (err: unknown) {
      console.error('Error cancelling appointment:', err);
      const errorObj = err as { detail?: string };
      toast.error(errorObj.detail || 'Error al cancelar la cita');
    }
  };

  const handleCancel = () => {
    setFormData({ patientId: '', doctorId: '', date: '', time: '' });
    setEditingId(null);
    setShowForm(false);
    setError(null);
    setAvailability([]);
  };

  const handleCheckAvailability = async () => {
    if (!formData.doctorId || !formData.date) {
      toast.warning('Por favor selecciona un médico y una fecha para consultar disponibilidad');
      return;
    }

    if (!token) {
      toast.error('No se encontró token de autenticación');
      return;
    }

    try {
      setLoadingAvailability(true);
      
      const scheduleData = await AppointmentApiService.getDoctorSchedule(token, formData.doctorId, formData.date);
      
      if (scheduleData.slots && scheduleData.slots.length > 0) {
        // Extraer solo las horas disponibles (disponible === true)
        const availableTimes = scheduleData.slots
          .filter(slot => slot.disponible)
          .map(slot => {
            const date = new Date(slot.fecha);
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          });
        
        if (availableTimes.length > 0) {
          setAvailability(availableTimes);
          toast.success(`Se encontraron ${availableTimes.length} horarios disponibles`);
        } else {
          setAvailability([]);
          toast.warning('No hay horarios disponibles para esta fecha');
        }
      } else {
        setAvailability([]);
        toast.warning('El médico no tiene disponibilidad configurada para esta fecha');
      }
    } catch (err: unknown) {
      console.error('Error checking availability:', err);
      const errorObj = err as { detail?: string };
      toast.error(errorObj.detail || 'Error al consultar disponibilidad');
      setAvailability([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner
          variant="bouncing-role"
          role={user?.role as 'Médico' | 'Paciente' | 'Secretario' | 'Administrador'}
          message="Cargando agendamiento..."
          size="medium"
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.page}>
        {/* Header */}
        <PageHeader
          title="Agendamiento de Citas"
          icon={<Calendar size={32} />}
        />

        {/* New Appointment Button */}
        <div className={styles.buttonSection}>
          <Button
            variant="filled"
            color="tertiary"
            onClick={() => (showForm ? handleCancel() : setShowForm(true))}
            startIcon={<Plus size={16} />}
          >
            {showForm ? 'Cerrar' : 'Nueva Cita'}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <NoResults 
            title="Error al gestionar citas" 
            description={error}
            icon={<Calendar size={32} />}
          />
        )}

        <Modal
          isOpen={showForm}
          onClose={handleCancel}
          title={editingId ? 'Editar Cita' : 'Crear Nueva Cita'}
          maxWidth="1200px"
        >
          <div className={styles.formSection}>
            <div className={styles.modalColumns}>
              {/* Columna Izquierda: Formulario */}
              <div className={styles.leftColumn}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="patient">
                      <User size={16} className={styles.labelIcon} />
                      Paciente
                    </label>
                    <select
                      id="patient"
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className={styles.select}
                      disabled={!!editingId}
                    >
                      <option value="">Selecciona un paciente</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.cedula})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="doctor">
                      <Stethoscope size={16} className={styles.labelIcon} />
                      Médico
                    </label>
                    <select
                      id="doctor"
                      value={formData.doctorId}
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                      className={styles.select}
                      disabled={!!editingId}
                    >
                      <option value="">Selecciona un médico</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} - {d.specialization}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="date">
                      <Calendar size={16} className={styles.labelIcon} />
                      Fecha
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="time">
                      <Clock size={16} className={styles.labelIcon} />
                      Hora
                    </label>
                    <input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Disponibilidad */}
              {!editingId && (
                <div className={styles.rightColumn}>
                  <div className={styles.availabilitySection}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleCheckAvailability}
                      disabled={!formData.doctorId || !formData.date || loadingAvailability}
                      startIcon={<Calendar size={16} />}
                    >
                      {loadingAvailability ? 'Consultando...' : 'Consultar Disponibilidad'}
                    </Button>
                    
                    {availability.length > 0 && (
                      <div className={styles.availabilityList}>
                        <p><strong>Horarios disponibles:</strong></p>
                        <div className={styles.timeSlots}>
                          {availability.map((time, index) => (
                            <Button
                              key={index}
                              variant="outlined"
                              color="tertiary"
                              onClick={() => setFormData({ ...formData, time: time })}
                              className={formData.time === time ? styles.selectedSlot : ''}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <Button variant="outlined" color="error" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                variant="filled"
                color="tertiary"
                onClick={handleAddAppointment}
              >
                {editingId ? 'Actualizar' : 'Crear'} Cita
              </Button>
            </div>
          </div>
        </Modal>

        {/* Appointments Table */}
        <div className={styles.tableSection}>
          <SectionHeader 
            title="Citas Agendadas" 
            icon={<Calendar size={20} />} 
          />
          <Table<Appointment>
            columns={[
              {
                key: 'patientName' as keyof Appointment,
                label: 'Paciente',
              },
              {
                key: 'doctorName' as keyof Appointment,
                label: 'Médico',
              },
              {
                key: 'fecha' as keyof Appointment,
                label: 'Fecha y Hora',
                render: (value) => {
                  const date = new Date(value as string);
                  return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
                },
              },
              {
                key: 'motivo' as keyof Appointment,
                label: 'Motivo',
              },
              {
                key: 'estado' as keyof Appointment,
                label: 'Estado',
                render: (value) => (
                  <Badge value={value as string} type="status" />
                ),
              },
              {
                key: 'notas' as keyof Appointment,
                label: 'Notas',
                render: (value) => (value as string) || '-',
              },
              {
                key: 'id' as keyof Appointment,
                label: 'Acciones',
                align: 'center',
                render: (_, row) => (
                  <div className={styles.actions}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleEditAppointment(row)}
                      startIcon={<Edit2 size={16} />}
                      disabled={row.estado === 'Cancelada'}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleCancelAppointment(row.id)}
                      startIcon={<X size={16} />}
                      disabled={row.estado === 'Cancelada'}
                    >
                      Cancelar
                    </Button>
                  </div>
                ),
              },
            ]}
            data={appointments}
            rowKey="id"
            emptyMessage="No hay citas agendadas"
          />
        </div>
      </div>
    </Container>
  );
};
