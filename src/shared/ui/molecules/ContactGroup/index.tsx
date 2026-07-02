import { ActionButton } from '@/shared/ui/atoms';
import { cn } from '@/shared/lib/classNames';
import type { ContactGroupItem, ContactGroupProps } from './ContactGroup.types';

/**
 * Ряд кнопок связи с автором объявления.
 * На мобильных (<sm) главный канал занимает всю ширину и стоит первым —
 * контакт в один тап; второстепенные делят строку ниже. Только CSS, без JS.
 */
function ContactGroup({
  primary,
  secondary = [],
  size = 'default',
  className,
  style,
}: ContactGroupProps) {
  const renderItem = (item: ContactGroupItem) => ({
    label: item.label,
    icon: item.icon,
    href: item.href,
    target: item.target,
    onClick: item.onClick,
  });

  return (
    <div className={cn('flex flex-wrap gap-2', className)} style={style}>
      <ActionButton
        {...renderItem(primary)}
        variant="primary"
        size={size}
        className="w-full sm:w-auto"
      />
      {secondary.map((item) => (
        <ActionButton
          key={item.key}
          {...renderItem(item)}
          variant="secondary"
          size={size}
          className="flex-1 sm:flex-none"
        />
      ))}
    </div>
  );
}

export { ContactGroup };
export type { ContactGroupProps, ContactGroupItem } from './ContactGroup.types';
