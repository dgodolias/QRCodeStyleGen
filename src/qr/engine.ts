import QRCodeStyling, { type Options } from 'qr-code-styling';
import { QR_PX } from '../constants';
import type { QRConfig, GradientSpec, StyleColor } from './types';

function toGradient(g: GradientSpec) {
  return { type: g.type, rotation: g.rotation, colorStops: g.colorStops };
}

/** Map our StyleColor to the library's `{color}` or `{color, gradient}` shape. */
function fill(s: StyleColor) {
  return s.gradient
    ? { color: s.color, gradient: toGradient(s.gradient) }
    : { color: s.color };
}

/** Translate our QRConfig into qr-code-styling Options.
 *  - type:'svg'        → we own a real SVG document (no canvas readback)
 *  - saveAsBlob:false   → CRITICAL. With saveAsBlob:true the engine's image onload
 *                         fires an XMLHttpRequest GET to re-encode the image; against a
 *                         `data:` URL that XHR is blocked by our CSP (connect-src 'self')
 *                         and the draw promise never resolves. We already canvas-re-encode
 *                         the logo in validateLogo, so we pass the clean data: URL straight
 *                         through (saveAsBlob:false) — embedded as-is in the SVG <image>,
 *                         and a data: URL never taints the export canvas. */
export function toQrOptions(cfg: QRConfig): Options {
  const opts: Options = {
    type: 'svg',
    width: QR_PX,
    height: QR_PX,
    margin: cfg.margin,
    data: cfg.data,
    qrOptions: { errorCorrectionLevel: cfg.errorCorrectionLevel },
    dotsOptions: { type: cfg.dots.type, ...fill(cfg.dots) },
    cornersSquareOptions: { type: cfg.cornersSquare.type, ...fill(cfg.cornersSquare) },
    cornersDotOptions: { type: cfg.cornersDot.type, ...fill(cfg.cornersDot) },
    backgroundOptions: fill(cfg.background),
  };

  if (cfg.logo) {
    opts.image = cfg.logo.dataUrl;
    opts.imageOptions = {
      saveAsBlob: false,
      hideBackgroundDots: cfg.logo.hideBackgroundDots,
      imageSize: cfg.logo.size,
      margin: cfg.logo.margin,
    };
  }

  return opts;
}

/** Render the QR (only — no frame/text) to an SVG string, headless.
 *  getRawData('svg') awaits the internal drawing promise, so the logo <image>
 *  is guaranteed present in the output. Throws if `data` is empty. */
export async function renderQrSvgString(cfg: QRConfig): Promise<string> {
  const qr = new QRCodeStyling(toQrOptions(cfg));
  const data = await qr.getRawData('svg');
  if (!data) throw new Error('QR generation returned no data');
  if (data instanceof Blob) return await data.text();
  // Node Buffer fallback (not used in the browser app).
  return (data as { toString(): string }).toString();
}
