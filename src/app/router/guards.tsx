import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import { getHomePath } from '@/shared/lib/home-route';
import { RouteLoader } from '@/app/router/RouteLoader';

interface RequireAuthProps {
  children: React.ReactElement;
  allowIncompleteProfile?: boolean;
}

/** Защита маршрутов: требует авторизацию и завершённый профиль. */
export function RequireAuth({ children, allowIncompleteProfile = false }: RequireAuthProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal();
    }
  }, [isAuthenticated, isLoading, openAuthModal]);

  if (isLoading) {
    return <RouteLoader />;
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to={getHomePath()}
        replace
        state={{ fromProtected: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
  if (!allowIncompleteProfile && user && user.profileCompleted === false) {
    return <Navigate to="/complete-profile" replace />;
  }
  return children;
}

/** Доступ только для role=admin. */
export function RequireAdmin({ children }: { children: React.ReactElement }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to={getHomePath()} replace />;
  if (user?.role !== 'admin') return <Navigate to={getHomePath()} replace />;
  return children;
}

/** Доступ для volunteer или admin. */
export function RequireVolunteer({ children }: { children: React.ReactElement }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to={getHomePath()} replace />;
  if (user?.role !== 'volunteer' && user?.role !== 'admin') return <Navigate to="/profile" replace />;
  return children;
}
