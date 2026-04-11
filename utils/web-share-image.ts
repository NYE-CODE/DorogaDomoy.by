/** Результат Web Share API с изображением. */
export type WebShareImageResult = 'shared' | 'aborted' | 'unavailable';

function mimeFromFilename(filename: string, blob: Blob): string {
  if (blob.type?.startsWith('image/')) return blob.type;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
}

/**
 * Ужимает PNG/JPEG в JPEG ≤ ~2.4 МБ — крупные story-карточки иначе часто
 * не проходят лимиты Chrome/Android при navigator.share(files).
 */
export async function compressImageBlobForShare(blob: Blob): Promise<Blob | null> {
  if (typeof createImageBitmap === 'undefined') return null;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(blob);
    const maxSide = 1080;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const maxSizeBytes = 2_400_000;
    let quality = 0.9;
    let best: Blob | null = null;
    for (let step = 0; step < 9; step++) {
      const jpegBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });
      if (!jpegBlob) break;
      best = jpegBlob;
      if (jpegBlob.size <= maxSizeBytes) return jpegBlob;
      quality -= 0.08;
      if (quality < 0.45) break;
    }
    return best;
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

type ShareMeta = { text?: string; url?: string; title?: string };

/**
 * Системное «Поделиться» с файлом изображения.
 * Несколько вариантов payload: с `url` часто падает canShare на Android при files+url.
 */
export async function tryShareImageFile(
  blob: Blob,
  filename: string,
  meta: ShareMeta,
): Promise<WebShareImageResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unavailable';
  }

  const makeFile = () => new File([blob], filename, { type: mimeFromFilename(filename, blob) });

  const payloads: ShareData[] = [
    { files: [makeFile()], text: meta.text, title: meta.title },
    { files: [makeFile()], text: meta.text, url: meta.url, title: meta.title },
    { files: [makeFile()] },
  ];

  for (const data of payloads) {
    if (!data.files?.length) continue;
    if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) continue;
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'aborted';
    }
  }
  return 'unavailable';
}
