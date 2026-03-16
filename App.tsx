import { Navigate } from 'react-router';

/**
 * Раньше главная страница с поиском была здесь.
 * Теперь поиск на /search, корень редиректит в main.tsx.
 */
export default function App() {
  return <Navigate to="/search" replace />;
}
