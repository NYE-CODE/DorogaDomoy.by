import { Button, type ButtonVariant } from '../Button';
import { Icon } from '../Icon';
import { cn } from '@/shared/lib/classNames';
import type { ActionButtonProps, ActionButtonVariant } from './ActionButton.types';
import styles from './ActionButton.module.css';

const variantMap: Record<ActionButtonVariant, ButtonVariant> = {
  primary: 'default',
  secondary: 'outline',
};

/**
 * Кнопка связи и ключевых действий: иконка + видимый текст.
 * При href рендерится ссылкой (tel:, мессенджеры) — контакт в один тап.
 * Focus-ring и disabled-состояния наследуются от примитива Button.
 */
function ActionButton({
  label,
  icon,
  variant = 'primary',
  size = 'default',
  href,
  target,
  onClick,
  disabled = false,
  type = 'button',
  className,
  style,
}: ActionButtonProps) {
  const content = (
    <>
      <Icon icon={icon} size="sm" />
      {label}
    </>
  );

  /* Отключённое действие всегда рендерим <button>: у <a> нет нативного disabled. */
  if (href !== undefined && !disabled) {
    return (
      <Button
        asChild
        variant={variantMap[variant]}
        size={size}
        className={cn(styles.root, 'rounded-lg', className)}
      >
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={onClick}
          style={style}
        >
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant={variantMap[variant]}
      size={size}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(styles.root, 'rounded-lg', className)}
      style={style}
    >
      {content}
    </Button>
  );
}

export { ActionButton };
export type {
  ActionButtonProps,
  ActionButtonVariant,
  ActionButtonSize,
} from './ActionButton.types';
