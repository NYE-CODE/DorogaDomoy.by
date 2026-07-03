import { Search } from 'lucide-react';
import { Input } from '../Input';
import { Icon } from '../Icon';
import { cn } from '@/shared/lib/classNames';
import type { SearchInputProps } from './SearchInput.types';
import styles from './SearchInput.module.css';

/**
 * Поле поиска/фильтра с иконкой лупы внутри.
 * className/style применяются к обёртке; ширину задаёт родитель.
 */
function SearchInput({ className, style, ...inputProps }: SearchInputProps) {
  return (
    <div className={cn('relative', className)} style={style}>
      <Icon
        icon={Search}
        size="sm"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        className={cn(styles.input, 'rounded-lg pl-9')}
        {...inputProps}
      />
    </div>
  );
}

export { SearchInput };
export type { SearchInputProps } from './SearchInput.types';
