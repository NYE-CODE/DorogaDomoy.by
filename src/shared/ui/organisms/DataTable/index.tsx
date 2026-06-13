import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/_primitives/table';
import { cn } from '@/shared/lib/classNames';
import type { DataTableOrganismProps } from '../types';
import styles from './DataTable.module.css';

/**
 * Обёртка над таблицей с toolbar и horizontal scroll.
 * Ячейки и строки — через re-export Table*.
 */
function DataTable({ toolbar, children, className, style }: DataTableOrganismProps) {
  return (
    <section className={cn(styles.root, className)} style={style}>
      {toolbar ? <div className={styles.toolbar}>{toolbar}</div> : null}
      <div className={styles.tableWrap}>
        <Table>{children}</Table>
      </div>
    </section>
  );
}

export {
  DataTable,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};

export type { DataTableOrganismProps };
