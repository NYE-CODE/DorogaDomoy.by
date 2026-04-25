import { useEffect } from 'react';

/**
 * Отключает вертикальную прокрутку body при активном модальном окне.
 * Поддерживает вложенные модалки через счётчик блокировок.
 * Работает на десктопе и мобильных устройствах.
 */
const lockState = {
  count: 0,
  scrollY: 0,
  routeKey: '',
  htmlOverflow: '',
  bodyOverflow: '',
  bodyPaddingRight: '',
  bodyPosition: '',
  bodyWidth: '',
  bodyTop: '',
};

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockState.count === 0) {
      lockState.scrollY = window.scrollY;
      lockState.routeKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      lockState.htmlOverflow = document.documentElement.style.overflow;
      lockState.bodyOverflow = document.body.style.overflow;
      lockState.bodyPaddingRight = document.body.style.paddingRight;
      lockState.bodyPosition = document.body.style.position;
      lockState.bodyWidth = document.body.style.width;
      lockState.bodyTop = document.body.style.top;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockState.scrollY}px`;
      document.body.style.width = '100%';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockState.count += 1;

    return () => {
      lockState.count -= 1;
      if (lockState.count <= 0) {
        lockState.count = 0;
        const currentRouteKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        document.documentElement.style.overflow = lockState.htmlOverflow || '';
        document.body.style.overflow = lockState.bodyOverflow || '';
        document.body.style.paddingRight = lockState.bodyPaddingRight || '';
        document.body.style.position = lockState.bodyPosition || '';
        document.body.style.width = lockState.bodyWidth || '';
        document.body.style.top = lockState.bodyTop || '';
        if (currentRouteKey === lockState.routeKey) {
          window.scrollTo({ top: lockState.scrollY, behavior: 'auto' });
        }
        lockState.routeKey = '';
      }
    };
  }, [active]);
}
