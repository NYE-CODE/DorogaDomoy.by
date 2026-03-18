/**
 * Единый хедер лендинга — используется на всех страницах.
 * Импорт из landing/app/components/header.
 */
import { Header as LandingHeader } from '../../landing/app/components/header';

interface HeaderProps {
  onViewChange?: (view: 'main') => void;
  selectedCity?: string;
  onCityClick?: () => void;
  onCreateClick?: () => void;
}

/** Хедер лендинга: логотип, кнопка создания, выбор региона, профиль/авторизация */
export function Header(_props?: HeaderProps) {
  return <LandingHeader />;
}
