import type { ComponentProps } from 'react';

export interface SearchInputProps
  extends Omit<ComponentProps<'input'>, 'type' | 'children'> {
  /** Обязателен: у поля нет видимого <label>. Локализованная строка (из t.*). */
  'aria-label': string;
  /** Локализованная строка (из t.*). */
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}
