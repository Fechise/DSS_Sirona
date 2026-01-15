import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PatientApiService, type PatientInfo } from '../../../services/api';
import styles from './PatientListPage.module.scss';
import { AlertCircle, Users, Search, Loader } from 'lucide-react';
import { Input } from '../../atoms/Input/Input';
import { Container } from '../../atoms/Container/Container';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';

export const PatientListPage: React.FC = () => {
  const { token } = useAuth();
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        <div className={styles.loadingState}>
          <Loader size={48} className={styles.spinner} />
          <p>Cargando lista de pacientes...</p>
        </div>
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
        />

        <div className={styles.statsSection}>
          <p>Total de pacientes: <strong>{patients.length}</strong></p>
        </div>

        <div className={styles.searchBox}>
          <Search size={20} />
          <Input
            id="patient-search"
            label=""
            placeholder="Buscar por nombre, email o cédula..."
            value={searchQuery}
            onChange={(value) => handleSearch(value)}
          />
        </div>

        <div className={styles.content}>
          {filteredPatients.length > 0 ? (
            <div className={styles.patientsList}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Cédula</th>
                    <th>Estado</th>
                    <th>Registrado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className={styles.tableRow}>
                      <td className={styles.name}>{patient.fullName}</td>
                      <td className={styles.email}>{patient.email}</td>
                      <td className={styles.cedula}>{patient.cedula}</td>
                      <td className={styles.status}>
                        <span className={`${styles.statusBadge} ${styles[patient.status.toLowerCase()]}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className={styles.date}>
                        {new Date(patient.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className={styles.actions}>
                        <button className={styles.actionBtn} title="Ver historial">
                          👁️
                        </button>
                        <button className={styles.actionBtn} title="Editar">
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>
    </Container>
  );
};
