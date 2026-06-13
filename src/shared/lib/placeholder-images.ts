import { tokens } from '@/shared/styles/tokens';

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const { placeholderBg, placeholderShape } = tokens.colors;

/** Плейсхолдер 96×96 для превью в админке и списках. */
export const PLACEHOLDER_PET_96 = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <rect width="96" height="96" fill="${placeholderBg}"/>
    <path d="M24 63l12-14 15 17 10-9 11 13H24z" fill="${placeholderShape}"/>
    <circle cx="39" cy="33" r="8" fill="${placeholderShape}"/>
  </svg>
`);

/** Плейсхолдер для маркеров на карте Leaflet. */
export const PLACEHOLDER_PET_MAP = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
    <rect width="160" height="120" fill="${placeholderBg}"/>
    <path d="M42 78l18-20 22 24 16-14 20 24H42z" fill="${placeholderShape}"/>
    <circle cx="63" cy="44" r="10" fill="${placeholderShape}"/>
  </svg>
`);

/** Плейсхолдер для печатной листовки объявления. */
export const PLACEHOLDER_PRINT_FLYER = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="${placeholderBg}"/>
    <path d="M210 390l90-102 116 128 86-74 98 118H210z" fill="${placeholderShape}"/>
    <circle cx="318" cy="214" r="42" fill="${placeholderShape}"/>
  </svg>
`);
