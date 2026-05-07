/**
 * Единый хедер лендинга — используется на всех страницах.
 * Импорт из landing/app/components/header.
 */
import { useEffect, useState } from 'react';
import { Header as LandingHeader } from '../../landing/app/components/header';
import type { HomeMode } from '../../landing/app/App';

const HOME_MODE_KEY = 'dorogadomoy-home-mode';

export interface HeaderProps {
  /** Выбранный город (из localStorage) — когда передан, хедер показывает его вместо «Вся Беларусь» */
  selectedCity?: string;
  /** При клике на выбор города — открыть модалку родителя (SearchPage/ProfilePage) */
  onCityClick?: () => void;
  onCreateClick?: () => void;
  showCitySelector?: boolean;
  showHomeModeToggle?: boolean;
}

/** Хедер лендинга: логотип, кнопка создания, выбор региона, профиль/авторизация */
export function Header(props?: HeaderProps) {
  const [homeMode, setHomeMode] = useState<HomeMode>(() => {
    if (typeof window === 'undefined') return 'search';
    const saved = window.localStorage.getItem(HOME_MODE_KEY);
    return saved === 'shelters' ? 'shelters' : 'search';
  });

  useEffect(() => {
    window.localStorage.setItem(HOME_MODE_KEY, homeMode);
  }, [homeMode]);

  return (
    <LandingHeader
      selectedCity={props?.selectedCity}
      onCityClick={props?.onCityClick}
      showCitySelector={props?.showCitySelector}
      showHomeModeToggle={props?.showHomeModeToggle ?? true}
      homeMode={homeMode}
      onHomeModeChange={setHomeMode}
    />
  );
}
