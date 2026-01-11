import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
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

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API calls: GET /api/secretary/patients, GET /api/secretary/doctors, GET /api/secretary/appointments
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock patients (demographic data only - no clinical records)
        setPatients([
          { id: '1', name: 'Juan Pérez', cedula: '1234567890', phone: '555-0101' },
          { id: '2', name: 'María González', cedula: '0987654321', phone: '555-0102' },
          { id: '3', name: 'Carlos Ruiz', cedula: '1122334455', phone: '555-0103' },
          { id: '4', name: 'Ana López', cedula: '5566778899', phone: '555-0104' },
        ]);

        // Mock doctors
        setDoctors([
          { id: 'doc-1', name: 'Dr. Roberto García', specialization: 'Cardiología' },
          { id: 'doc-2', name: 'Dra. Laura Martínez', specialization: 'Pediatría' },
          { id: 'doc-3', name: 'Dr. Fernando López', specialization: 'Traumatología' },
        ]);

        // Mock appointments
        setAppointments([
          {
            id: 'apt-1',
            patientId: '1',
            patientName: 'Juan Pérez',
            doctorId: 'doc-1',
            doctorName: 'Dr. Roberto García',
            date: '2026-01-15',
            time: '09:00',
            status: 'scheduled',
          },
          {
            id: 'apt-2',
            patientId: '2',
            patientName: 'María González',
            doctorId: 'doc-2',
            doctorName: 'Dra. Laura Martínez',
            date: '2026-01-16',
            time: '14:30',
            status: 'scheduled',
          },
        ]);
      } catch (err) {
        setError('Error al cargar los datos de citas');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddAppointment = () => {
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time) {
      setError('Por favor completa todos los campos');
      return;
    }

    const patient = patients.find((p) => p.id === formData.patientId);
    const doctor = doctors.find((d) => d.id === formData.doctorId);

    if (!patient || !doctor) {
      setError('Paciente o médico no encontrado');
      return;
    }

    if (editingId) {
      // Update existing appointment
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
      // Create new appointment
      const newAppointment: Appointment = {
        id: `apt-${Date.now()}`,
        patientId: formData.patientId,
        patientName: patient.name,
        doctorId: formData.doctorId,
        doctorName: doctor.name,
        date: formData.date,
        time: formData.time,
        status: 'scheduled',
      };
      setAppointments([...appointments, newAppointment]);
    }

    setFormData({ patientId: '', doctorId: '', date: '', time: '' });
    setShowForm(false);
    setError(null);
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

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== id));
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
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <Calendar size={32} />
            <h1>Agendamiento de Citas</h1>
          </div>
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
        <div className={styles.securityNote}>
          <AlertCircle size={16} />
          <p>
            <strong>Nota de Seguridad (PBI-16):</strong> Solo tienes acceso a datos demográficos de pacientes (nombre, teléfono).
            Los historiales clínicos no son accesibles desde esta sección.
          </p>
        </div>

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
          {appointments.length === 0 ? (
            <p className={styles.emptyMessage}>No hay citas agendadas</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Cédula</th>
                    <th>Médico</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => {
                    const patient = patients.find((p) => p.id === apt.patientId);
                    return (
                      <tr key={apt.id}>
                        <td>{apt.patientName}</td>
                        <td>{patient?.cedula}</td>
                        <td>{apt.doctorName}</td>
                        <td>{new Date(apt.date).toLocaleDateString('es-ES')}</td>
                        <td>{apt.time}</td>
                        <td>
                          <span className={`${styles.status} ${styles[apt.status]}`}>
                            {apt.status === 'scheduled' ? 'Agendada' : apt.status === 'completed' ? 'Completada' : 'Cancelada'}
                          </span>
                        </td>
                        <td className={styles.actions}>
                          <Button
                            variant="filled"
                            color="secondary"
                            onClick={() => handleEditAppointment(apt)}
                            startIcon={<Edit2 size={16} />}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="filled"
                            color="tertiary"
                            onClick={() => handleDeleteAppointment(apt.id)}
                            startIcon={<Trash2 size={16} />}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Container>
  );
};
