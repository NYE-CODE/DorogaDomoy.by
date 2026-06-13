import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Объединяет class names с поддержкой Tailwind merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
