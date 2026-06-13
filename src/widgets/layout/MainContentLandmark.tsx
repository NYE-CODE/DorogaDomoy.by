import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** Помечает `<main>` на каждой странице для skip-link и screen readers. */
export function MainContentLandmark() {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    main.id = 'main-content';
    if (!main.hasAttribute('tabindex')) {
      main.tabIndex = -1;
    }
  }, [pathname]);

  return null;
}
