import React, { useState, useEffect } from 'react';
import styles from './DoctorPatientsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Users, RefreshCw, FileText, Calendar } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Badge } from '../../atoms/Badge/Badge';
import { useNavigate } from 'react-router-dom';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';

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

  const columns: TableColumn<PacienteAsignado>[] = [
    {
      key: 'fullName',
      label: 'Nombre',
      render: (_, row) => (
        <div className={styles.patientName}>
          <strong>{row.fullName}</strong>
          <span className={styles.email}>{row.email}</span>
        </div>
      ),
    },
    {
      key: 'cedula',
      label: 'Cédula',
    },
    {
      key: 'fechaNacimiento',
      label: 'Edad',
      render: (_, row) => `${calcularEdad(row.fechaNacimiento)} años`,
    },
    {
      key: 'ultimaConsulta',
      label: 'Última Consulta',
      render: (value) => {
        if (value) {
          return (
            <div className={styles.consultaInfo}>
              <Calendar size={14} />
              <span>{new Date(value).toLocaleDateString('es-ES')}</span>
            </div>
          );
        }
        return <span className={styles.noConsulta}>Sin consultas</span>;
      },
    },
    {
      key: 'diagnosticos',
      label: 'Diagnósticos',
      render: (value) => (
        <Badge
          value={`${value} registro${value !== 1 ? 's' : ''}`}
          type="outlined"
        />
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_, row) => (
        <Button
          variant="filled"
          color="primary"
          onClick={() => handleVerHistorial(row.id)}
          startIcon={<FileText size={16} />}
        >
          Ver Historial
        </Button>
      ),
    },
  ];

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
        <div className={styles.headerWrapper}>
          <PageHeader title="Mis Pacientes Asignados" icon={<Users size={28} />} />
          <p className={styles.subtitle}>
            Lista de pacientes bajo tu cuidado médico
          </p>
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

        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} />
            <p>No tienes pacientes asignados</p>
            <span className={styles.hint}>
              Contacta con el administrador para que te asigne pacientes
            </span>
          </div>
        ) : (
          <Table
            columns={columns}
            data={pacientes}
            emptyMessage="No hay pacientes para mostrar"
            rowKey="id"
          />
        )}
      </main>
    </Container>
  );
};
