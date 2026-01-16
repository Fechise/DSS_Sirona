<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import styles from './AuditLogsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { FileText, RefreshCw, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
=======
import React, { useState, useEffect } from 'react';
import styles from './AuditLogsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { FileText, RefreshCw, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminApiService, type AuditLogEntry } from '../../../services/api';

<<<<<<< HEAD
const LOGS_PER_PAGE = 20;

export const AuditLogsPage: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [eventFilter, setEventFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  const loadEventTypes = useCallback(async () => {
    if (!token) return;
    try {
      // Hardcoded event types since backend doesn't have this endpoint yet
      const types = [
        'login_success',
        'login_failed',
        'login_blocked',
        'doctor_registered',
        'patient_registered',
        'appointment_created',
        'appointment_updated',
        'appointment_deleted',
        'doctor_availability_created'
      ];
      setEventTypes(types);
    } catch (err) {
      console.error('Error loading event types:', err);
    }
  }, [token]);

  const loadLogs = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * LOGS_PER_PAGE;
      const data = await AdminApiService.getAuditLogs(token, skip, LOGS_PER_PAGE);
      setLogs(data.logs);
      setTotalLogs(data.total);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, eventFilter, emailFilter]);

  useEffect(() => {
    loadEventTypes();
  }, [loadEventTypes]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  const handleSearch = () => {
    setCurrentPage(1);
=======
export const AuditLogsPage: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  
  // Filters
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const loadEventTypes = async () => {
    if (!token) return;
    try {
      const data = await AdminApiService.getAuditEventTypes(token);
      setEventTypes(data.event_types);
    } catch (err) {
      console.error('Error loading event types:', err);
    }
  };

  const loadLogs = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await AdminApiService.getAuditLogs(
        token,
        page * pageSize,
        pageSize,
        selectedEventType || undefined,
        searchEmail || undefined
      );
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.detail || 'Error al cargar logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventTypes();
  }, [token]);

  useEffect(() => {
    loadLogs();
  }, [token, page, selectedEventType]);

  const handleSearch = () => {
    setPage(0);
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    loadLogs();
  };

  const handleClearFilters = () => {
<<<<<<< HEAD
    setEventFilter('');
    setEmailFilter('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
=======
    setSelectedEventType('');
    setSearchEmail('');
    setPage(0);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

<<<<<<< HEAD
  const getEventColor = (event: string): string => {
    if (event.includes('login_failed') || event.includes('blocked') || event.includes('corrupted')) {
      return styles.eventDanger;
    }
    if (event.includes('login_success') || event.includes('created') || event.includes('verified')) {
      return styles.eventSuccess;
    }
    if (event.includes('changed') || event.includes('updated') || event.includes('edited')) {
      return styles.eventWarning;
    }
    return styles.eventNeutral;
  };

=======
  const getEventColor = (event: string) => {
    if (event.includes('FALLIDO') || event.includes('DENEGADO') || event.includes('CORRUPTO')) {
      return styles.eventDanger;
    }
    if (event.includes('EXITOSO') || event.includes('CREADO')) {
      return styles.eventSuccess;
    }
    if (event.includes('EDITADO') || event.includes('CAMBIADO')) {
      return styles.eventWarning;
    }
    return styles.eventInfo;
  };

  const totalPages = Math.ceil(total / pageSize);

>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Logs de Auditoría"
          icon={<FileText size={32} />}
        />

<<<<<<< HEAD
        <div className={styles.description}>
          <p>
            Visualiza todos los eventos del sistema. Los logs incluyen accesos, modificaciones
            de usuarios, cambios en historiales médicos y alertas de seguridad.
          </p>
        </div>

        {/* Filtros */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label htmlFor="eventFilter">Tipo de Evento</label>
              <select
                id="eventFilter"
                className={styles.select}
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="">Todos los eventos</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="emailFilter">Email de Usuario</label>
              <input
                id="emailFilter"
                type="text"
                className={styles.textInput}
                placeholder="Buscar por email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            </div>

            <div className={styles.filterActions}>
=======
        <p className={styles.subtitle}>
          Registro de todas las acciones realizadas en el sistema
        </p>

        {/* Filtros */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Tipo de Evento</label>
            <select
              className={styles.select}
              value={selectedEventType}
              onChange={(e) => {
                setSelectedEventType(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos los eventos</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Buscar por Email</label>
            <div className={styles.searchGroup}>
              <Input
                id="search-email"
                type="text"
                value={searchEmail}
                onChange={(value) => setSearchEmail(value)}
                placeholder="usuario@sirona.com"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
              <Button
                variant="filled"
                color="primary"
                onClick={handleSearch}
<<<<<<< HEAD
                startIcon={<Search size={16} />}
              >
                Buscar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
              >
                Limpiar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={loadLogs}
                disabled={loading}
                startIcon={<RefreshCw size={16} className={loading ? styles.spinner : ''} />}
              >
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className={styles.statsBar}>
          <span>Total: <strong>{totalLogs}</strong> registros</span>
          <span>Página <strong>{currentPage}</strong> de <strong>{totalPages || 1}</strong></span>
        </div>

        {/* Tabla de logs */}
=======
              >
                <Search size={16} />
              </Button>
            </div>
          </div>
          <div className={styles.filterActions}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearFilters}
              startIcon={<Filter size={16} />}
            >
              Limpiar Filtros
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={loadLogs}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Stats */}
        <div className={styles.stats}>
          <span>Total: <strong>{total}</strong> registros</span>
          <span>Página {page + 1} de {totalPages || 1}</span>
        </div>

        {/* Table */}
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando logs...</p>
          </div>
<<<<<<< HEAD
        ) : (
          <div className={styles.logsContainer}>
            {logs.length === 0 ? (
              <div className={styles.emptyState}>
                <FileText size={48} />
                <p>No se encontraron logs con los filtros aplicados</p>
              </div>
            ) : (
              <table className={styles.logsTable}>
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Evento</th>
                    <th>Usuario</th>
                    <th>IP</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className={styles.dateCell}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td>
                        <span className={`${styles.eventBadge} ${getEventColor(log.event)}`}>
                          {log.event}
                        </span>
                      </td>
                      <td className={styles.emailCell}>
                        {log.user_email || '-'}
                      </td>
                      <td className={styles.ipCell}>
                        {log.ip_address}
                      </td>
                      <td className={styles.detailsCell}>
                        {log.details ? (
                          <details className={styles.detailsExpander}>
                            <summary>Ver detalles</summary>
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </details>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Paginación */}
=======
        ) : logs.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <p>No se encontraron registros</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Evento</th>
                  <th>Usuario</th>
                  <th>IP</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.timestampCell}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td>
                      <span className={`${styles.eventBadge} ${getEventColor(log.event)}`}>
                        {log.event}
                      </span>
                    </td>
                    <td className={styles.userCell}>
                      {log.user_email || '-'}
                    </td>
                    <td className={styles.ipCell}>
                      {log.ip_address}
                    </td>
                    <td className={styles.detailsCell}>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <details className={styles.detailsAccordion}>
                          <summary>Ver detalles</summary>
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              variant="outlined"
              color="secondary"
<<<<<<< HEAD
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
=======
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
              startIcon={<ChevronLeft size={16} />}
            >
              Anterior
            </Button>
<<<<<<< HEAD
            
            <div className={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`${styles.pageButton} ${currentPage === pageNum ? styles.active : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              endIcon={<ChevronRight size={16} />}
=======
            <span className={styles.pageInfo}>
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              startIcon={<ChevronRight size={16} />}
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
            >
              Siguiente
            </Button>
          </div>
        )}
      </main>
    </Container>
  );
};
