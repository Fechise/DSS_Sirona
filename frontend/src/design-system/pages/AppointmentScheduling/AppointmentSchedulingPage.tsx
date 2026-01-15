import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { AlertNote } from '../../molecules/AlertNote/AlertNote';
import { Table } from '../../molecules/Table/Table';
import { useAuth } from '../../../contexts/AuthContext';
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
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};

type AppointmentForm = {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
};

export const AppointmentSchedulingPage: React.FC = () => {
  const { token } = useAuth();
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
          patientId: apt.patient_id,
          patientName: apt.patientName,
          doctorId: apt.doctor_id,
          doctorName: apt.doctorName,
          date: apt.fecha.split('T')[0],
          time: apt.fecha.split('T')[1]?.substring(0, 5) || '',
          status: apt.estado.toLowerCase() as 'scheduled' | 'completed' | 'cancelled'
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
      setError('Por favor completa todos los campos');
      return;
    }

    if (!token) {
      setError('No se encontró token de autenticación');
      return;
    }

    const patient = patients.find((p) => p.id === formData.patientId);
    const doctor = doctors.find((d) => d.id === formData.doctorId);

    if (!patient || !doctor) {
      setError('Paciente o médico no encontrado');
      return;
    }

    try {
      if (editingId) {
        // Update existing appointment
        await AppointmentApiService.updateAppointment(token, editingId, {
          fecha: `${formData.date}T${formData.time}:00`
        });
        setAppointments(
          appointments.map((apt) =>
            apt.id === editingId
              ? {
                ...apt,
                patientId: formData.patientId,
                patientName: patient.name,
                doctorId: formData.doctorId,
                doctorName: doctor.name,
                date: formData.date,
                time: formData.time,
              }
              : apt
          )
        );
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
          patientId: newApt.patient_id,
          patientName: newApt.patientName,
          doctorId: newApt.doctor_id,
          doctorName: newApt.doctorName,
          date: newApt.fecha.split('T')[0],
          time: newApt.fecha.split('T')[1]?.substring(0, 5) || '',
          status: 'scheduled',
        };
        setAppointments([...appointments, newAppointment]);
      }

      setFormData({ patientId: '', doctorId: '', date: '', time: '' });
      setShowForm(false);
      setError(null);
    } catch (err: unknown) {
      console.error('Error saving appointment:', err);
      const errorObj = err as { detail?: string };
      setError(errorObj.detail || 'Error al guardar la cita');
    }
  };

  const handleEditAppointment = (apt: Appointment) => {
    setFormData({
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      date: apt.date,
      time: apt.time,
    });
    setEditingId(apt.id);
    setShowForm(true);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!token) {
      setError('No se encontró token de autenticación');
      return;
    }

    try {
      await AppointmentApiService.deleteAppointment(token, id);
      setAppointments(appointments.filter((apt) => apt.id !== id));
    } catch (err: unknown) {
      console.error('Error deleting appointment:', err);
      const errorObj = err as { detail?: string };
      setError(errorObj.detail || 'Error al eliminar la cita');
    }
  };

  const handleCancel = () => {
    setFormData({ patientId: '', doctorId: '', date: '', time: '' });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) {
    return (
      <Container>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando agendamiento...</p>
        </div>
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
            color="primary"
            onClick={() => setShowForm(!showForm)}
            startIcon={<Plus size={16} />}
          >
            {showForm ? 'Cancelar' : 'Nueva Cita'}
          </Button>
        </div>

        {/* Security Note */}
        <AlertNote title="Nota de Seguridad (PBI-16):">
          Solo tienes acceso a datos demográficos de pacientes (nombre, teléfono).
          Los historiales clínicos no son accesibles desde esta sección.
        </AlertNote>

        {/* Error Alert */}
        {error && (
          <div className={styles.alert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className={styles.formSection}>
            <h2>{editingId ? 'Editar Cita' : 'Crear Nueva Cita'}</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="patient">Paciente</label>
                <select
                  id="patient"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className={styles.select}
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
                <label htmlFor="doctor">Médico</label>
                <select
                  id="doctor"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className={styles.select}
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
                <label htmlFor="date">Fecha</label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="time">Hora</label>
                <input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="filled" color="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                variant="filled"
                color="primary"
                onClick={handleAddAppointment}
              >
                {editingId ? 'Actualizar' : 'Crear'} Cita
              </Button>
            </div>
          </div>
        )}

        {/* Appointments Table */}
        <div className={styles.tableSection}>
          <h2>Citas Agendadas</h2>
          <Table<Appointment>
            columns={[
              {
                key: 'patientName' as keyof Appointment,
                label: 'Paciente',
              },
              {
                key: 'patientId' as keyof Appointment,
                label: 'Cédula',
                render: (value) => {
                  const patient = patients.find((p) => p.id === value);
                  return patient?.cedula;
                },
              },
              {
                key: 'doctorName' as keyof Appointment,
                label: 'Médico',
              },
              {
                key: 'date' as keyof Appointment,
                label: 'Fecha',
                render: (value) => new Date(value as string).toLocaleDateString('es-ES'),
              },
              {
                key: 'time' as keyof Appointment,
                label: 'Hora',
              },
              {
                key: 'status' as keyof Appointment,
                label: 'Estado',
                render: (value) => {
                  const statusText =
                    value === 'scheduled'
                      ? 'Agendada'
                      : value === 'completed'
                        ? 'Completada'
                        : 'Cancelada';
                  return (
                    <span className={`${styles.status} ${styles[value]}`}>
                      {statusText}
                    </span>
                  );
                },
              },
              {
                key: 'id' as keyof Appointment,
                label: 'Acciones',
                align: 'right',
                render: (_, row) => (
                  <div className={styles.actions}>
                    <Button
                      variant="filled"
                      color="secondary"
                      onClick={() => handleEditAppointment(row)}
                      startIcon={<Edit2 size={16} />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="filled"
                      color="tertiary"
                      onClick={() => handleDeleteAppointment(row.id)}
                      startIcon={<Trash2 size={16} />}
                    >
                      Eliminar
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
