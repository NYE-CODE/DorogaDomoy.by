import type { Pet } from '../../model/types';

export interface PetMapPopupProps {
  pet: Pet;
  /**
   * Локализованные строки передаются пропсами: попап рендерится
   * в отдельном React-корне внутри Leaflet-DOM, вне дерева провайдеров.
   */
  title: string;
  statusLabel: string;
  detailsLabel: string;
  /** Открыть объявление. Не задан (hover-tooltip на десктопе) — кнопка не рендерится. */
  onDetails?: () => void;
}
