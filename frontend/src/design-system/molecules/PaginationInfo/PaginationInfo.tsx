import React from 'react';
import styles from './PaginationInfo.module.scss';

type PaginationInfoProps = {
  total: number;
  currentPage: number;
  pageSize: number;
  loading?: boolean;
};

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  total,
  currentPage,
  pageSize,
  loading = false,
}) => {
  const startRecord = currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, total);

  return (
    <div className={styles.container}>
      <span className={styles.text}>
        {loading ? (
          'Cargando...'
        ) : (
          <>
            Mostrando <strong>{startRecord}</strong> a <strong>{endRecord}</strong> de{' '}
            <strong>{total}</strong> resultados
          </>
        )}
      </span>
    </div>
  );
};
