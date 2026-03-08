import { useEffect } from 'react';

/**
 * Отключает вертикальную прокрутку body при активном модальном окне.
 * Поддерживает вложенные модалки через счётчик блокировок.
 * Работает на десктопе и мобильных устройствах.
 */
const lockCount = { current: 0 };

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    lockCount.current += 1;
    const prevOverflow = document.body.style.overflow;
    const prevOverflowHtml = document.documentElement.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      lockCount.current -= 1;
      if (lockCount.current <= 0) {
        lockCount.current = 0;
        document.documentElement.style.overflow = prevOverflowHtml || '';
        document.body.style.overflow = prevOverflow || '';
        document.body.style.paddingRight = prevPaddingRight || '';
      }
    };
  }, [active]);
}
