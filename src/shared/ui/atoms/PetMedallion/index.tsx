import { cn } from '@/shared/lib/classNames';
import { PLACEHOLDER_PET_96 } from '@/shared/lib/placeholder-images';
import type { PetMedallionProps, PetMedallionRegister, PetMedallionSize } from './PetMedallion.types';
import styles from './PetMedallion.module.css';

/** Цвет ободка и «ушка» — семантические токены регистров (tokens.css). */
const registerBorderClass: Record<PetMedallionRegister, string> = {
  lost: 'border-lost',
  found: 'border-found',
  shelter: 'border-shelter',
  medallion: 'border-medallion',
};

const sizeClass: Record<PetMedallionSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
};

/**
 * Медальон-жетон: круглое фото питомца с ободком цвета регистра.
 * Та же геометрия, что фото-маркер карты (leaflet-pet-photo-icon) — одна
 * фирменная форма на списках, в профилях и на карте.
 */
function PetMedallion({
  src,
  alt = '',
  register,
  size = 'md',
  withEar = false,
  className,
  style,
}: PetMedallionProps) {
  return (
    <span
      className={cn(styles.root, sizeClass[size], withEar && styles.withEar, className)}
      style={style}
    >
      {withEar && (
        <span aria-hidden="true" className={cn(styles.ear, registerBorderClass[register])} />
      )}
      <span className={cn(styles.disc, registerBorderClass[register])}>
        <img
          src={src || PLACEHOLDER_PET_96}
          alt={alt}
          loading="lazy"
          className={styles.photo}
          onError={(event) => {
            const img = event.currentTarget;
            if (img.src !== PLACEHOLDER_PET_96) img.src = PLACEHOLDER_PET_96;
          }}
        />
      </span>
    </span>
  );
}

export { PetMedallion };
export type { PetMedallionProps, PetMedallionRegister, PetMedallionSize } from './PetMedallion.types';
