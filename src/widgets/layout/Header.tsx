/**
 * ������ ����� �������� � ������������ �� ���� ���������.
 * ������ �� landing/app/components/header.
 */
import { Header as LandingHeader } from '../../../landing/app/components/header';

export interface HeaderProps {
  /** ��������� ����� (�� localStorage) � ����� �������, ����� ���������� ��� ������ ���� ��������� */
  selectedCity?: string;
  /** ��� ����� �� ����� ������ � ������� ������� �������� (SearchPage/ProfilePage) */
  onCityClick?: () => void;
  onCreateClick?: () => void;
  showCitySelector?: boolean;
}

/** ����� ��������: �������, ������ ��������, ����� �������, �������/����������� */
export function Header(props?: HeaderProps) {
  return (
    <LandingHeader
      selectedCity={props?.selectedCity}
      onCityClick={props?.onCityClick}
      showCitySelector={props?.showCitySelector}
    />
  );
}
