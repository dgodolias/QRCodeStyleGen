// Logo upload validation + sanitization.
//
// The logo is the only user-supplied binary the app touches, so it gets the full
// fail-closed treatment: cheap checks first, then a canvas re-encode that strips any
// embedded metadata / trailing payload / polyglot. Only the re-encoded data URL is
// ever handed to the QR engine — never the original File.

export type LogoRejectReason = 'size' | 'mime' | 'magic' | 'decode' | 'dimensions';

export interface LogoResult {
  ok: boolean;
  reason?: LogoRejectReason;
  cleanDataUrl?: string;
  width?: number;
  height?: number;
}

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;
type AllowedKind = 'png' | 'jpeg' | 'webp';

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_LOGO_DIM = 2048; // px per side

const MIME_TO_KIND: Record<string, AllowedKind> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
};

async function readHead(file: File, n: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, n).arrayBuffer());
}

/** Identify the real file kind by magic bytes — extension/MIME are not trusted. */
function detectMagic(b: Uint8Array): AllowedKind | null {
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return 'png';
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return 'jpeg';
  }
  // WEBP: "RIFF" at offset 0 AND "WEBP" at offset 8 (a 4-byte size sits between).
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = url;
  });
}

/** Rasterize the decoded image to a fresh canvas and read it back as a PNG data URL.
 *  This discards EXIF/ICC, trailing bytes, and any non-pixel payload. */
function reencodeToPng(img: HTMLImageElement): { dataUrl: string; w: number; h: number } {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('decode');
  ctx.drawImage(img, 0, 0, w, h);
  return { dataUrl: canvas.toDataURL('image/png'), w, h };
}

export async function validateAndSanitizeLogo(file: File): Promise<LogoResult> {
  if (file.size > MAX_LOGO_BYTES) return { ok: false, reason: 'size' };

  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, reason: 'mime' };
  }

  const head = await readHead(file, 12);
  const magic = detectMagic(head);
  // Magic must exist AND agree with the declared MIME family (kills renamed .svg etc.).
  if (!magic || magic !== MIME_TO_KIND[file.type]) {
    return { ok: false, reason: 'magic' };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    if (img.naturalWidth > MAX_LOGO_DIM || img.naturalHeight > MAX_LOGO_DIM) {
      return { ok: false, reason: 'dimensions' };
    }
    const { dataUrl, w, h } = reencodeToPng(img);
    return { ok: true, cleanDataUrl: dataUrl, width: w, height: h };
  } catch {
    return { ok: false, reason: 'decode' };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const LOGO_REJECT_MESSAGE: Record<LogoRejectReason, string> = {
  size: `Image is too large (max ${Math.round(MAX_LOGO_BYTES / 1024 / 1024)} MB).`,
  mime: 'Only PNG, JPEG or WebP images are allowed.',
  magic: 'This file is not a real PNG/JPEG/WebP image.',
  decode: 'Could not read this image.',
  dimensions: `Image is too big (max ${MAX_LOGO_DIM}×${MAX_LOGO_DIM}px).`,
};
