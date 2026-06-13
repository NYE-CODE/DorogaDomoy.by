import { Text } from '@/shared/ui/atoms/Text';
import { cn } from '@/shared/lib/classNames';
import type { FormOrganismProps } from '../types';
import styles from './Form.module.css';

/** Layout-обёртка формы: заголовок, поля, footer с actions. */
function Form({
  title,
  description,
  footer,
  className,
  style,
  children,
  ...formProps
}: FormOrganismProps) {
  return (
    <form className={cn(styles.root, className)} style={style} {...formProps}>
      {(title || description) && (
        <div className={styles.header}>
          {title ? (
            <Text as="h2" variant="heading2">
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text as="p" variant="caption">
              {description}
            </Text>
          ) : null}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </form>
  );
}

export { Form };
export type { FormOrganismProps };
