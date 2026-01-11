import React, { useState, useEffect } from 'react';
import styles from './DoctorPatientsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Users, RefreshCw, FileText, Calendar } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { useNavigate } from 'react-router-dom';

type PacienteAsignado = {
  id: string;
  fullName: string;
  email: string;
  cedula: string;
  fechaNacimiento: string;
  ultimaConsulta: string | null;
  diagnosticos: number;
};

export const DoctorPatientsPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<PacienteAsignado[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Cargar pacientes asignados (mock por ahora, luego integrar con backend)
  const loadPacientes = async () => {
    setLoading(true);
    try {
      // TODO: Integrar con FastAPI (GET /api/medico/pacientes-asignados)
      // const res = await fetch('/api/medico/pacientes-asignados', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await res.json();
      // setPacientes(data.pacientes);
      
      // Mock data
      await new Promise((r) => setTimeout(r, 600));
      setPacientes([
        {
          id: 'pac-001',
          fullName: 'María González',
          email: 'maria@correo.com',
          cedula: '1234567890',
          fechaNacimiento: '1985-03-15',
          ultimaConsulta: '2025-12-20',
          diagnosticos: 3,
        },
        {
          id: 'pac-002',
          fullName: 'Carlos Ruiz',
          email: 'carlos@correo.com',
          cedula: '0987654321',
          fechaNacimiento: '1990-07-22',
          ultimaConsulta: '2025-11-10',
          diagnosticos: 2,
        },
        {
          id: 'pac-003',
          fullName: 'Ana López',
          email: 'ana@correo.com',
          cedula: '5678901234',
          fechaNacimiento: '1978-11-05',
          ultimaConsulta: null,
          diagnosticos: 0,
        },
      ]);
    } catch (error) {
      console.error('Error loading pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, []);

  const handleVerHistorial = (pacienteId: string) => {
    navigate(`/medico/pacientes/${pacienteId}/historial`);
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  return (
    <Container>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <Users size={28} />
              <h1>Mis Pacientes Asignados</h1>
            </div>
            <Button
              variant="filled"
              color="secondary"
              onClick={loadPacientes}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          </div>
          <p className={styles.subtitle}>
            Lista de pacientes bajo tu cuidado médico
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando pacientes...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Edad</th>
                  <th>Última Consulta</th>
                  <th>Diagnósticos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>
                      <div className={styles.patientName}>
                        <strong>{paciente.fullName}</strong>
                        <span className={styles.email}>{paciente.email}</span>
                      </div>
                    </td>
                    <td>{paciente.cedula}</td>
                    <td>{calcularEdad(paciente.fechaNacimiento)} años</td>
                    <td>
                      {paciente.ultimaConsulta ? (
                        <div className={styles.consultaInfo}>
                          <Calendar size={14} />
                          <span>{new Date(paciente.ultimaConsulta).toLocaleDateString('es-ES')}</span>
                        </div>
                      ) : (
                        <span className={styles.noConsulta}>Sin consultas</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {paciente.diagnosticos} registro{paciente.diagnosticos !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="filled"
                        color="primary"
                        onClick={() => handleVerHistorial(paciente.id)}
                        startIcon={<FileText size={16} />}
                      >
                        Ver Historial
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pacientes.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={48} />
            <p>No tienes pacientes asignados</p>
            <span className={styles.hint}>
              Contacta con el administrador para que te asigne pacientes
            </span>
          </div>
        )}
      </main>
    </Container>
  );
};
