/**
 * Единый хедер лендинга — используется на всех страницах.
 * Импорт из landing/app/components/header.
 */
import { Header as LandingHeader } from '../../landing/app/components/header';

export interface HeaderProps {
  onViewChange?: (view: 'main') => void;
  /** Выбранный город (из localStorage) — когда передан, хедер показывает его вместо «Вся Беларусь» */
  selectedCity?: string;
  /** При клике на выбор города — открыть модалку родителя (SearchPage/ProfilePage) */
  onCityClick?: () => void;
  onCreateClick?: () => void;
}

/** Хедер лендинга: логотип, кнопка создания, выбор региона, профиль/авторизация */
export function Header(props?: HeaderProps) {
  return (
    <LandingHeader
      selectedCity={props?.selectedCity}
      onCityClick={props?.onCityClick}
    />
  );
}
