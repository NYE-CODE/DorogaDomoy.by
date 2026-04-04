import { useAuth } from '../context/AuthContext';

/**
 * Для публичных CTA: если сессия ещё проверяется — ничего не делаем;
 * если не залогинен — открываем глобальный AuthModal (как на карте при «Создать объявление»).
 */
export function useAuthenticatedAction() {
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();

  const runWhenAuthed = (action: () => void) => {
    if (isLoading) return;
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    action();
  };

  return { runWhenAuthed };
}
