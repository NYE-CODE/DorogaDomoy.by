import { Toaster } from 'sonner';
import { useTheme } from '@/app/providers/ThemeContext';

/** Глобальные toast-уведомления Sonner с темой приложения. */
export function GlobalToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={theme}
      toastOptions={{
        duration: 4500,
        classNames: { toast: 'font-sans' },
      }}
    />
  );
}
