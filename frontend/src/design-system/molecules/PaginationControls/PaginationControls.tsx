import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import styles from './PaginationControls.module.scss';

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  loading?: boolean;
};

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  loading = false,
}) => {
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  return (
    <div className={styles.container}>
      <Button
        variant="outlined"
        color="secondary"
        onClick={onPreviousPage}
        disabled={isFirstPage || loading}
        startIcon={<ChevronLeft size={16} />}
      >
        Anterior
      </Button>

      <span className={styles.pageInfo}>
        Página <strong>{currentPage + 1}</strong> de <strong>{totalPages || 1}</strong>
      </span>

      <Button
        variant="outlined"
        color="secondary"
        onClick={onNextPage}
        disabled={isLastPage || loading}
        startIcon={<ChevronRight size={16} />}
      >
        Siguiente
      </Button>
    </div>
  );
};
