import { useI18n } from '@/app/providers/I18nContext';

/** Skip link для навигации с клавиатуры (WCAG 2.4.1). */
export function SkipToContent() {
  const { t } = useI18n();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const main = document.querySelector('main');
    if (!main) return;
    main.id = 'main-content';
    if (main.tabIndex < 0) main.tabIndex = -1;
    main.focus({ preventScroll: false });
    main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <a href="#main-content" className="skip-link" onClick={handleClick}>
      {t.common.skipToContent}
    </a>
  );
}
