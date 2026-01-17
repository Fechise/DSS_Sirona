import React, { useState, useEffect } from 'react';
import styles from './AuditLogsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { FileText, RefreshCw, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminApiService, type AuditLogEntry } from '../../../services/api';

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
    loadLogs();
  };

  const handleClearFilters = () => {
    setSelectedEventType('');
    setSearchEmail('');
    setPage(0);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Logs de Auditoría"
          icon={<FileText size={32} />}
        />

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
              <Button
                variant="filled"
                color="primary"
                onClick={handleSearch}
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
        {loading ? (
          <LoadingSpinner
            variant="bouncing-role"
            role="Administrador"
            message="Cargando logs..."
            size="large"
          />
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
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              startIcon={<ChevronLeft size={16} />}
            >
              Anterior
            </Button>
            <span className={styles.pageInfo}>
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              startIcon={<ChevronRight size={16} />}
            >
              Siguiente
            </Button>
          </div>
        )}
      </main>
    </Container>
  );
};
