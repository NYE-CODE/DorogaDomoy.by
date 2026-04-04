/** Результат попытки системного «Поделиться» (Web Share API). */
export type InstagramSystemShareResult = 'shared' | 'aborted' | 'unavailable';

export function resolvePetImageUrlForShare(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `${typeof window !== 'undefined' ? window.location.protocol : 'https:'}${src}`;
  if (src.startsWith('/') && typeof window !== 'undefined') return `${window.location.origin}${src}`;
  return src;
}

/** Копирование изображения в буфер (для вставки Ctrl+V в Instagram Web). */
export async function tryCopyImageToClipboard(imageUrl: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
    return false;
  }
  try {
    const resolved = resolvePetImageUrlForShare(imageUrl.trim());
    const res = await fetch(resolved, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return false;
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Пытается открыть системное меню «Поделиться» с фото объявления и текстом —
 * на многих телефонах можно выбрать Instagram и попасть в окно публикации.
 */
export async function trySharePetForInstagram(
  imageUrl: string | undefined,
  text: string,
  title: string,
): Promise<InstagramSystemShareResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unavailable';
  }

  const runShare = async (data: ShareData): Promise<InstagramSystemShareResult> => {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'aborted';
      return 'unavailable';
    }
  };

  if (imageUrl?.trim()) {
    try {
      const resolved = resolvePetImageUrlForShare(imageUrl.trim());
      const res = await fetch(resolved, { mode: 'cors', credentials: 'omit' });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.type.startsWith('image/')) {
          const ext = blob.type.includes('png') ? 'png' : 'jpeg';
          const file = new File([blob], `dorogadomoy-pet.${ext}`, { type: blob.type });
          const withFiles: ShareData = { files: [file], text, title };
          const can =
            typeof navigator.canShare !== 'function' || navigator.canShare(withFiles);
          if (can) {
            const out = await runShare(withFiles);
            if (out === 'shared' || out === 'aborted') return out;
          }
        }
      }
    } catch {
      /* CORS, сеть или не изображение */
    }
  }

  const textOnly: ShareData = { text, title };
  return runShare(textOnly);
}
