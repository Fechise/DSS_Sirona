import React, { useState, useEffect } from 'react';
import styles from './AuditLogsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { FileText, RefreshCw, Search } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { FilterSelect } from '../../atoms/FilterSelect/FilterSelect';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PaginationInfo } from '../../molecules/PaginationInfo/PaginationInfo';
import { PaginationControls } from '../../molecules/PaginationControls/PaginationControls';
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

  // Definir columnas de la tabla
  const columns: TableColumn<AuditLogEntry>[] = [
    {
      key: 'timestamp' as keyof AuditLogEntry,
      label: 'Fecha/Hora',
      render: (value: string) => formatTimestamp(value),
    },
    {
      key: 'event' as keyof AuditLogEntry,
      label: 'Evento',
      render: (value: string) => (
        <span className={`${styles.eventBadge} ${getEventColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'user_email' as keyof AuditLogEntry,
      label: 'Usuario',
      render: (value: string | null) => value || '-',
    },
    {
      key: 'ip_address' as keyof AuditLogEntry,
      label: 'IP',
    },
    {
      key: 'details' as keyof AuditLogEntry,
      label: 'Detalles',
      render: (value: any) =>
        value && Object.keys(value).length > 0 ? (
          <details className={styles.detailsAccordion}>
            <summary>Ver detalles</summary>
            <pre>{JSON.stringify(value, null, 2)}</pre>
          </details>
        ) : (
          '-'
        ),
    },
  ];

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


  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Logs de Auditoría"
          icon={<FileText size={32} />}
          subtitle="Administra los logs de auditoría del sistema"
        />

        {/* Filtros */}
        <TableToolbar
          left={
            <>
              <FilterSelect
                id="event-type-filter"
                value={selectedEventType}
                onChange={(value) => {
                  setSelectedEventType(value);
                  setPage(0);
                }}
                placeholder="Todos los eventos"
                options={eventTypes.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
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
                  startIcon={<Search size={16} />}
                >
                  Buscar
                </Button>
              </div>
            </>
          }
          right={
            <Button
              variant="filled"
              color="primary"
              onClick={loadLogs}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          }
        />

        {/* Error */}
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Info de paginación */}
        {!loading && logs.length > 0 && (
          <PaginationInfo
            total={total}
            currentPage={page}
            pageSize={pageSize}
            loading={loading}
          />
        )}

        {/* Table */}
        {loading ? (
          <LoadingSpinner
            variant="bouncing-role"
            role="Administrador"
            message="Cargando logs..."
            size="large"
          />
        ) : (
          <Table<AuditLogEntry>
            columns={columns}
            data={logs}
            emptyMessage="No se encontraron registros de auditoría"
            rowKey="id"
          />
        )}

        {/* Controles de paginación */}
        {total > pageSize && (
          <PaginationControls
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            onPreviousPage={() => setPage((p) => Math.max(0, p - 1))}
            onNextPage={() => setPage((p) => Math.min(Math.ceil(total / pageSize) - 1, p + 1))}
            loading={loading}
          />
        )}
      </main>
    </Container>
  );
};
