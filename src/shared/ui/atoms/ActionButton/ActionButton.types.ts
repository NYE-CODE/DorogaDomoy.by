import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, MouseEventHandler } from 'react';

/** primary — единственный главный CTA на экране; secondary — сопутствующие действия. */
export type ActionButtonVariant = 'primary' | 'secondary';

/** cta (h-12) — для ключевого действия страницы (связь с автором и т.п.). */
export type ActionButtonSize = 'default' | 'cta';

export interface ActionButtonProps {
  /** Локализованная подпись действия (из t.*). */
  label: string;
  icon: LucideIcon;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  /** tel: / viber:// / https://t.me/… — при наличии рендерится <a>. */
  href?: string;
  /** Для внешних ссылок; rel="noopener noreferrer" добавляется автоматически. */
  target?: '_blank';
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  style?: CSSProperties;
}
