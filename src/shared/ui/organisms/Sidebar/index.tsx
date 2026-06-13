import { cn } from '@/shared/lib/classNames';
import type { SidebarOrganismProps } from '../types';
import styles from './Sidebar.module.css';

/** Боковая панель с header/body/footer слотами. */
function Sidebar({ header, children, footer, className, style }: SidebarOrganismProps) {
  return (
    <aside className={cn(styles.root, className)} style={style}>
      {header ? <div className={styles.header}>{header}</div> : null}
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </aside>
  );
}

export { Sidebar };
export type { SidebarOrganismProps };
