import L from 'leaflet';
import { PET_STATUS_MARKER_BORDER_HEX } from './pet-helpers';

/** Цвет обводки кружка маркера по статусу объявления */
export const PET_STATUS_MARKER_COLORS: Record<string, string> = {
  ...PET_STATUS_MARKER_BORDER_HEX,
  spotted: '#f97316',
  fostering: '#a855f7',
  shelter: '#6366f1',
  returned: '#10b981',
  adopted: '#059669',
  transferred: '#14b8a6',
};

/** Обводка маркера «видел похожее» / выбранная точка на карте формы */
export const SIGHTING_MARKER_BORDER_COLOR = '#f59e0b';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">' +
      '<rect width="160" height="120" fill="#f3f4f6"/>' +
      '<path d="M42 78l18-20 22 24 16-14 20 24H42z" fill="#d1d5db"/>' +
      '<circle cx="63" cy="44" r="10" fill="#d1d5db"/>' +
    '</svg>',
  );

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
    (PET_STATUS_MARKER_COLORS[options.status] || '#6b7280');
  const safeSrc = getSafePetPhotoSrc(options.photoUrl);
  const key = `${color}:${size}:${borderWidth}:${safeSrc}`;

  const cached = iconCache.get(key);
  if (cached) return cached;

  const escapedSrc = safeSrc.replace(/"/g, '&quot;');
  const escapedFallback = FALLBACK_IMAGE.replace(/"/g, '&quot;');

  const icon = L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;border:${borderWidth}px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,.25);background:#fff;overflow:hidden">
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
