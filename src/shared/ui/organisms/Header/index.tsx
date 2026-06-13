import { cn } from '@/shared/lib/classNames';
import type { HeaderOrganismProps } from '../types';
import styles from './Header.module.css';

/**
 * Презентационный header-shell: logo / navigation / actions.
 * Не содержит auth, routing или i18n — только layout-слоты.
 */
function Header({ logo, navigation, actions, className, style }: HeaderOrganismProps) {
  return (
    <header className={cn(styles.root, className)} style={style}>
      {logo}
      {navigation ? <nav className={styles.nav} aria-label="Main">{navigation}</nav> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export { Header };
export type { HeaderOrganismProps };
