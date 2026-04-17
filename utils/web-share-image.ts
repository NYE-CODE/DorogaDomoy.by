/** Результат Web Share API с изображением. */
export type WebShareImageResult = 'shared' | 'aborted' | 'unavailable';

export type CompressImageForShareOptions = {
  /** Максимум по длинной стороне после масштабирования (по умолчанию 1080). */
  maxLongSide?: number;
  /** Целевой верхний предел размера файла в байтах (по умолчанию ~2.4 МБ). */
  maxSizeBytes?: number;
};

function mimeFromFilename(filename: string, blob: Blob): string {
  if (blob.type?.startsWith('image/')) return blob.type;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
}

async function loadBitmapFromBlob(blob: Blob): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch {
      /* ниже — запасной путь через <img> */
    }
  }
  return null;
}

/** Декодирование через Image + canvas (если createImageBitmap недоступен или падает). */
async function drawBlobToCanvas(blob: Blob, maxLongSide: number): Promise<HTMLCanvasElement | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('img'));
    });
    img.src = url;
    await loaded;
    const scale = Math.min(1, maxLongSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Ужимает PNG/JPEG в JPEG под лимит — для story-карточек и мобильного Chrome.
 */
export async function compressImageBlobForShare(
  blob: Blob,
  opts: CompressImageForShareOptions = {},
): Promise<Blob | null> {
  const maxLongSide = opts.maxLongSide ?? 1080;
  const maxSizeBytes = opts.maxSizeBytes ?? 2_400_000;

  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    bitmap = await loadBitmapFromBlob(blob);
    if (bitmap) {
      const scale = Math.min(1, maxLongSide / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, w, h);
    } else {
      canvas = await drawBlobToCanvas(blob, maxLongSide);
      if (!canvas) return null;
    }

    const ctxCanvas = canvas;
    let quality = 0.9;
    let best: Blob | null = null;
    for (let step = 0; step < 12; step++) {
      const jpegBlob = await new Promise<Blob | null>((resolve) => {
        ctxCanvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });
      if (!jpegBlob) break;
      best = jpegBlob;
      if (jpegBlob.size <= maxSizeBytes) return jpegBlob;
      quality -= 0.06;
      if (quality < 0.35) break;
    }
    return best;
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

type ShareMeta = { text?: string; url?: string; title?: string };
type ShareImageOptions = { fileOnly?: boolean };

/**
 * Системное «Поделиться» с файлом изображения.
 * Не опираемся только на canShare: на Android Chrome он часто ложно возвращает false
 * для JPEG и больших файлов, хотя navigator.share() срабатывает.
 */
export async function tryShareImageFile(
  blob: Blob,
  filename: string,
  meta: ShareMeta,
  options: ShareImageOptions = {},
): Promise<WebShareImageResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unavailable';
  }

  const makeFile = () => new File([blob], filename, { type: mimeFromFilename(filename, blob) });

  const payloads: ShareData[] = options.fileOnly
    ? [{ files: [makeFile()] }]
    : [
        { files: [makeFile()], text: meta.text, title: meta.title },
        { files: [makeFile()], text: meta.text, url: meta.url, title: meta.title },
        { files: [makeFile()] },
      ];

  for (const data of payloads) {
    if (!data.files?.length) continue;
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'aborted';
    }
  }
  return 'unavailable';
}
