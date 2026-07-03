/**
 * App shell header — re-exports landing header with app-specific props.
 * See landing/app/components/header.
 */
import { Header as LandingHeader } from '../../../landing/app/components/header';

export interface HeaderProps {
  /** Selected city from localStorage; shown when showCitySelector is true */
  selectedCity?: string;
  /** Opens city picker instead of inline selector (SearchPage/ProfilePage) */
  onCityClick?: () => void;
  onCreateClick?: () => void;
  showCitySelector?: boolean;
}

/** App header: logo, nav, city, auth */
export function Header(props?: HeaderProps) {
  return (
    <LandingHeader
      selectedCity={props?.selectedCity}
      onCityClick={props?.onCityClick}
      showCitySelector={props?.showCitySelector}
    />
  );
}
