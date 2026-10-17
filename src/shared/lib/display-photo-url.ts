const UPLOAD_WIDTHS = [256, 480, 640, 960, 1280] as const;

export type UploadDisplayWidth = (typeof UPLOAD_WIDTHS)[number];

/** Уменьшенная копия своего файла из /uploads. Чужие URL не меняет. */
export function displayPhotoUrl(url: string, width: UploadDisplayWidth): string {
  if (!url.includes('/uploads/')) return url;
  if (/[?&]w=\d+/.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}w=${width}`;
}
