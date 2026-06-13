import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/_primitives/select';
import { cn } from '@/shared/lib/classNames';
import type { DropdownItemProps, DropdownProps } from './Dropdown.types';
import styles from './Dropdown.module.css';

/**
 * Выпадающий список на базе Radix Select.
 * Для контекстных меню используйте `_primitives/dropdown-menu`.
 */
function Dropdown({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  className,
  style,
  triggerClassName,
  children,
}: DropdownProps) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(styles.trigger, triggerClassName, className)} style={style}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={styles.content}>{children}</SelectContent>
    </Select>
  );
}

function DropdownItem({ value, disabled, className, style, children }: DropdownItemProps) {
  return (
    <SelectItem value={value} disabled={disabled} className={className} style={style}>
      {children}
    </SelectItem>
  );
}

export {
  Dropdown,
  DropdownItem,
  SelectGroup as DropdownGroup,
  SelectLabel as DropdownLabel,
  SelectSeparator as DropdownSeparator,
};

export type { DropdownProps, DropdownItemProps } from './Dropdown.types';

// Re-export Select API для совместимости
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/_primitives/select';
