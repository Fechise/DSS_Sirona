import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PatientApiService, type PatientInfo } from '../../../services/api';
import styles from './PatientListPage.module.scss';
import { AlertCircle, Users, Search } from 'lucide-react';
import { Badge } from '../../atoms/Badge/Badge';
import { Input } from '../../atoms/Input/Input';
import { Container } from '../../atoms/Container/Container';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';

export const PatientListPage: React.FC = () => {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Definir columnas de la tabla
  const columns: TableColumn<PatientInfo>[] = [
    {
      key: 'fullName',
      label: 'Nombre Completo',
    },
    {
      key: 'cedula',
      label: 'Cédula',
    },
    {
      key: 'fechaNacimiento',
      label: 'Fecha de Nacimiento',
      render: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : '-',
    },
    {
      key: 'telefonoContacto',
      label: 'Teléfono',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
        <Badge value={value} type="status" />
      ),
    },
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await PatientApiService.getPatientsList(token);
        setPatients(data.patients || []);
        setFilteredPatients(data.patients || []);
      } catch (err: any) {
        console.error('Error al obtener pacientes:', err);
        setError(err.detail || 'Error al cargar la lista de pacientes');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [token]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = patients.filter(patient => 
      patient.fullName.toLowerCase().includes(query.toLowerCase()) ||
      patient.email.toLowerCase().includes(query.toLowerCase()) ||
      patient.cedula.includes(query)
    );
    setFilteredPatients(filtered);
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner
          variant="bouncing-role"
          role={user?.role as 'Médico' | 'Paciente' | 'Secretario' | 'Administrador'}
          message="Cargando lista de pacientes..."
          size="medium"
          customIcon={<Users size={36} />}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className={styles.errorState}>
          <AlertCircle size={48} />
          <h2>Error al cargar pacientes</h2>
          <p>{error}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.page}>
        <PageHeader 
          title="Listado de Pacientes" 
          icon={<Users size={32} />}
          subtitle={`Total de pacientes: ${patients.length}`}
        />

        <div className={styles.searchSection}>
          <Input
            id="patient-search"
            label=""
            placeholder="Buscar por nombre, email o cédula..."
            value={searchQuery}
            onChange={(value) => handleSearch(value)}
            icon={<Search size={20} />}
          />
        </div>

        {filteredPatients.length > 0 ? (
          <div className={styles.tableWrapper}>
            <Table<PatientInfo>
              columns={columns}
              data={filteredPatients}
              emptyMessage="No se encontraron pacientes"
            />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Users size={48} />
            <p>
              {searchQuery 
                ? 'No se encontraron pacientes con los criterios de búsqueda.' 
                : 'No hay pacientes registrados aún.'}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
};
