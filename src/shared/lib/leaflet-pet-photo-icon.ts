import L from 'leaflet';
import { tokens } from '@/shared/styles/tokens';
import { PET_STATUS_MARKER_BORDER_HEX } from './pet-helpers';
import { PLACEHOLDER_PET_MAP } from './placeholder-images';

/** Цвет обводки кружка маркера по статусу объявления */
export const PET_STATUS_MARKER_COLORS: Record<string, string> = {
  ...PET_STATUS_MARKER_BORDER_HEX,
  spotted: tokens.map.spotted,
  fostering: tokens.map.fostering,
  shelter: tokens.map.shelter,
  returned: tokens.map.returned,
  adopted: tokens.map.adopted,
  transferred: tokens.map.transferred,
};

/** Обводка маркера «видел похожее» / выбранная точка на карте формы */
export const SIGHTING_MARKER_BORDER_COLOR = tokens.map.sighting;

const FALLBACK_IMAGE = PLACEHOLDER_PET_MAP;

export function getSafePetPhotoSrc(url?: string): string {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith('data:image/')) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

const iconCache = new Map<string, L.DivIcon>();

export function getPetPhotoCircleDivIcon(options: {
  photoUrl?: string;
  status: string;
  size?: number;
  borderWidth?: number;
  /** Цвет кольца вместо цвета по статусу (например, точки наблюдений) */
  borderColor?: string;
}): L.DivIcon {
  const size = options.size ?? 38;
  const borderWidth = options.borderWidth ?? 3;
  const half = Math.round(size / 2);
  const color =
    options.borderColor ??
    (PET_STATUS_MARKER_COLORS[options.status] || tokens.map.fallback);
  const safeSrc = getSafePetPhotoSrc(options.photoUrl);
  const key = `${color}:${size}:${borderWidth}:${safeSrc}`;

  const cached = iconCache.get(key);
  if (cached) return cached;

  const escapedSrc = safeSrc.replace(/"/g, '&quot;');
  const escapedFallback = FALLBACK_IMAGE.replace(/"/g, '&quot;');

  const icon = L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;border:${borderWidth}px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,.25);background:${tokens.colors.bgBase};overflow:hidden">
        <img
          src="${escapedSrc}"
          alt=""
          loading="lazy"
          style="width:100%;height:100%;object-fit:cover;display:block"
          onerror="this.onerror=null;this.src='${escapedFallback}'"
        />
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -Math.max(12, half - 4)],
  });

  iconCache.set(key, icon);
  return icon;
}
