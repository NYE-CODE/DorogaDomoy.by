import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, MouseEventHandler } from 'react';

export interface ContactGroupItem {
  /** Стабильный ключ канала: 'phone' | 'telegram' | 'viber' | … */
  key: string;
  /** Локализованная подпись (из t.*). */
  label: string;
  icon: LucideIcon;
  /** tel: / viber:// / https://t.me/… */
  href?: string;
  target?: '_blank';
  onClick?: MouseEventHandler<HTMLElement>;
}

export interface ContactGroupProps {
  /** Главный канал (обычно «Позвонить»): primary-вариант, на <sm растягивается на всю ширину. */
  primary: ContactGroupItem;
  /** Второстепенные каналы (мессенджеры и т.п.), рендерятся secondary-вариантом. */
  secondary?: ContactGroupItem[];
  /** cta (h-12) — для главного блока связи на странице объявления. */
  size?: 'default' | 'cta';
  className?: string;
  style?: CSSProperties;
}
