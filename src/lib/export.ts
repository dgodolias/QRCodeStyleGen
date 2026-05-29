import { BUNDLED_FONT_FAMILY } from '../constants';
import type { MasterSvg } from '../compositor/serializeMasterSvg';
import type { ExportFormat } from '../qr/types';

/** Make sure the bundled webfont is actually loaded before we rasterize, otherwise
 *  SVG <text> falls back / vanishes in the PNG (the SVG-in-<img> render can only use
 *  fonts the document already has). System fonts need no preload. */
async function ensureFontsLoaded(): Promise<void> {
  if (!('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`400 64px "${BUNDLED_FONT_FAMILY}"`),
      document.fonts.load(`600 64px "${BUNDLED_FONT_FAMILY}"`),
    ]);
    await document.fonts.ready;
  } catch {
    /* non-fatal — fall back to system fonts */
  }
}

function svgToBlobUrl(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to rasterize SVG'));
    img.src = url;
  });
}

interface RasterOptions {
  scale: number;
  mime: 'image/png' | 'image/jpeg';
  quality?: number;
  background?: string | null;
}

/** master SVG string -> Blob URL -> <img> -> canvas @scale -> raster Blob.
 *  This is the same path qr-code-styling uses internally for png/jpeg, so it is
 *  well-supported. The logo is a base64 data URL (same-origin), so the canvas never
 *  taints. JPEG gets a flattened background (transparency would render black otherwise). */
export async function rasterize(master: MasterSvg, opts: RasterOptions): Promise<Blob> {
  await ensureFontsLoaded();
  const url = svgToBlobUrl(master.svg);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(master.width * opts.scale));
    canvas.height = Math.max(1, Math.round(master.height * opts.scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    if (opts.background) {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.setTransform(opts.scale, 0, 0, opts.scale, 0, 0);
    ctx.drawImage(img, 0, 0, master.width, master.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
        opts.mime,
        opts.quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export interface ExportOptions {
  scale?: number;
  quality?: number;
  fileName?: string;
}

export async function exportArtifact(
  master: MasterSvg,
  fmt: ExportFormat,
  opts: ExportOptions = {},
): Promise<void> {
  const name = (opts.fileName || 'qr-code').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 64) || 'qr-code';

  if (fmt === 'svg') {
    triggerDownload(new Blob([master.svg], { type: 'image/svg+xml;charset=utf-8' }), `${name}.svg`);
    return;
  }

  const scale = opts.scale ?? 3;
  if (fmt === 'png') {
    const blob = await rasterize(master, { scale, mime: 'image/png', background: null });
    triggerDownload(blob, `${name}.png`);
  } else {
    const blob = await rasterize(master, {
      scale,
      mime: 'image/jpeg',
      quality: opts.quality ?? 0.92,
      background: '#ffffff',
    });
    triggerDownload(blob, `${name}.jpg`);
  }
}
