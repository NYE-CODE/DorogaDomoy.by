import { Input } from '@/shared/ui/atoms/Input';
import { Text } from '@/shared/ui/atoms/Text';
import { Label } from '@/shared/ui/_primitives/label';
import { cn } from '@/shared/lib/classNames';
import type { FormFieldProps } from './FormField.types';
import styles from './FormField.module.css';

/**
 * Поле формы: Label + Input + сообщение об ошибке или подсказка.
 */
function FormField({
  id,
  label,
  error,
  hint,
  required,
  labelClassName,
  errorClassName,
  className,
  style,
  containerClassName,
  containerStyle,
  ...inputProps
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;

  return (
    <div className={cn(styles.root, containerClassName)} style={containerStyle}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
        {required ? ' *' : null}
      </Label>
      <Input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId ?? hintId}
        className={className}
        style={style}
        {...inputProps}
      />
      {error ? (
        <Text as="span" variant="caption" id={errorId} className={cn(styles.error, errorClassName)}>
          {error}
        </Text>
      ) : hint ? (
        <Text as="span" variant="caption" id={hintId} className={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

export { FormField };
export type { FormFieldProps } from './FormField.types';
