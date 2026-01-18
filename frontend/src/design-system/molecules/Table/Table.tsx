import { type ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { NoResults } from '../NoResults/NoResults';
import styles from './Table.module.scss';

export type TableColumn<T> = {
  key: keyof T;
  label: string;
  render?: (value: any, row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T, index: number) => string);
};

function TableComponent<T extends { id?: any }>({
  columns,
  data,
  emptyMessage = 'No hay datos para mostrar',
  rowKey = 'id' as keyof T,
}: TableProps<T>) {
  const { user } = useAuth();

  const getColorByRole = (): 'primary' | 'secondary' | 'tertiary' | 'quaternary' => {
    switch (user?.role) {
      case 'Médico':
        return 'primary';
      case 'Paciente':
        return 'secondary';
      case 'Secretario':
        return 'tertiary';
      case 'Administrador':
        return 'quaternary';
      default:
        return 'secondary';
    }
  };

  const roleColor = getColorByRole();

  const getRowKey = (row: any, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    return String(row[rowKey as string]);
  };

  if (data.length === 0) {
    return (
      <NoResults 
        title={emptyMessage}
        icon={<FileQuestion size={48} />}
        fullHeight
      />
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={`${styles.table} ${styles[roleColor]}`}>
        <thead>
          <tr>
            {columns.map((column, colIndex) => (
              <th
                key={`${String(column.key)}-${colIndex}`}
                style={{
                  textAlign: column.align || 'left',
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column, colIndex) => {
                const value = row[column.key];
                const content = column.render
                  ? column.render(value, row, rowIndex)
                  : (value as ReactNode);

                return (
                  <td
                    key={`${String(column.key)}-${colIndex}`}
                    style={{
                      textAlign: column.align || 'left',
                    }}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Table = TableComponent;
