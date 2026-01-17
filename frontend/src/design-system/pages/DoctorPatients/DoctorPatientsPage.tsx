import React, { useState, useEffect } from 'react';
import styles from './DoctorPatientsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Users, RefreshCw, FileText, Calendar } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Badge } from '../../atoms/Badge/Badge';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { DoctorApiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/useToast';

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
  const { token } = useAuth();
  const { error, success } = useToast();

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
      align: 'center',
      render: (_, row) => (
        <div className={styles.actions}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleVerHistorial(row.id)}
            startIcon={<FileText size={16} />}
          >
            Ver Historial
          </Button>
        </div>
      ),
    },
  ];

  // Cargar pacientes asignados desde el backend
  const loadPacientes = async () => {
    if (!token) {
      error('No se encontró token de autenticación');
      return;
    }
    setLoading(true);
    try {
      const response = await DoctorApiService.getMyPatients(token);
      // Mapear la respuesta del backend al formato esperado
      const mappedPacientes: PacienteAsignado[] = response.pacientes.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        cedula: p.cedula,
        fechaNacimiento: p.fechaNacimiento || '',
        ultimaConsulta: p.ultimaConsulta || null,
        diagnosticos: 0,
      }));
      setPacientes(mappedPacientes);
      success('Pacientes cargados exitosamente');
    } catch (err) {
      console.error('Error loading pacientes:', err);
      error('Error al cargar los pacientes. Por favor, intente nuevamente.');
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
        <PageHeader 
        title="Mis Pacientes Asignados" 
        icon={<Users size={28} />} 
        subtitle="Lista de pacientes bajo tu cuidado médico"
        />

        <TableToolbar
          right={
            <Button
              variant="filled"
              color="primary"
              onClick={loadPacientes}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          }
        />

        {loading ? (
          <LoadingSpinner
            variant="bouncing-role"
            role="Médico"
            message="Cargando pacientes..."
            size="large"
          />
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
