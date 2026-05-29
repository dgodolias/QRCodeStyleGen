import DOMPurify from 'dompurify';
import { QR_PX, MASTER_W, FRAME_BLOCK_H, TEXT_BAND_H } from '../constants';
import type { FrameDef, FrameRenderOpts } from '../frames/types';

const CTA_FONT = '"Inter", system-ui, sans-serif';

export interface MasterInput {
  /** SVG string of the styled QR only (from renderQrSvgString). */
  qrSvg: string;
  frame: FrameDef;
  /** ctaText MUST already be XML-escaped by the caller. */
  frameStyle: { color: string; textColor: string; ctaText: string; ctaSize: number };
  /** text MUST already be XML-escaped by the caller. */
  additionalText: { text: string; font: string; size: number; color: string } | null;
  /** Per-dot shrink factor for the "dot spacing" control. 1 = dots touch (default);
   *  <1 inserts a gap between data dots. Only data dots shrink — finder patterns stay
   *  solid so scannability is preserved. */
  dotScale?: number;
}

export interface MasterSvg {
  svg: string;
  width: number;
  height: number;
}

/** Prefix every id and its references (url(#id), href="#id") so the QR's gradient/clip
 *  ids cannot collide with the frame's when both live in one document. */
function namespaceIds(root: Element, prefix: string): void {
  const map = new Map<string, string>();
  root.querySelectorAll('[id]').forEach((el) => {
    const old = el.getAttribute('id');
    if (!old) return;
    const next = prefix + old;
    el.setAttribute('id', next);
    map.set(old, next);
  });
  if (map.size === 0) return;

  root.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      let v = attr.value;
      if (v.includes('url(')) {
        // Handle url(#id), url('#id') and url("#id") — qr-code-styling emits single quotes.
        v = v.replace(/url\((['"]?)#([^'")]+)\1\)/g, (_m, q: string, id: string) => {
          return `url(${q}#${map.get(id) ?? id}${q})`;
        });
      }
      if ((attr.name === 'href' || attr.name === 'xlink:href') && v.startsWith('#')) {
        v = '#' + (map.get(v.slice(1)) ?? v.slice(1));
      }
      if (v !== attr.value) el.setAttribute(attr.name, v);
    }
  });
}

/** Shrink each DATA dot toward its own centre to open a gap between dots.
 *  qr-code-styling emits one element per module inside the dots clipPath, each carrying a
 *  `rotate(angle, cx, cy)` transform whose pivot (cx,cy) is the cell centre — we reuse that
 *  centre to scale in place. Finder-pattern dots live in their OWN clipPaths
 *  (corners-square / corners-dot), so they are untouched and stay solid. */
function applyDotScale(qrRoot: Element, dotScale: number): void {
  if (dotScale >= 0.999) return;
  const dotsClip = Array.from(qrRoot.querySelectorAll('clipPath')).find((cp) =>
    (cp.getAttribute('id') ?? '').includes('clip-path-dot-color'),
  );
  if (!dotsClip) return;

  for (const el of Array.from(dotsClip.children)) {
    const tr = el.getAttribute('transform') ?? '';
    const m = tr.match(/rotate\(\s*-?[\d.]+\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/);
    let cx: number, cy: number;
    if (m) {
      cx = parseFloat(m[1]!);
      cy = parseFloat(m[2]!);
    } else if (el.tagName === 'rect') {
      cx = parseFloat(el.getAttribute('x') ?? '0') + parseFloat(el.getAttribute('width') ?? '0') / 2;
      cy = parseFloat(el.getAttribute('y') ?? '0') + parseFloat(el.getAttribute('height') ?? '0') / 2;
    } else if (el.tagName === 'circle') {
      cx = parseFloat(el.getAttribute('cx') ?? '0');
      cy = parseFloat(el.getAttribute('cy') ?? '0');
    } else {
      continue;
    }
    el.setAttribute(
      'transform',
      `${tr} translate(${cx} ${cy}) scale(${dotScale.toFixed(4)}) translate(${-cx} ${-cy})`,
    );
  }
}

/** Compose frame + QR + additional text into one master SVG (author space 0..1000 wide).
 *  The result is safe by construction: the frame template is ours, the CTA/additional
 *  text are pre-escaped, and the QR (incl. the re-encoded logo data URL) comes from the
 *  trusted engine. Used verbatim for the export/raster path (loaded as a non-scripting
 *  <img>); the live-DOM preview path runs it through sanitizeSvgForDom() first. */
export function buildMasterSvg(input: MasterInput): MasterSvg {
  const qrDoc = new DOMParser().parseFromString(input.qrSvg, 'image/svg+xml');
  const qrRoot = qrDoc.documentElement;
  applyDotScale(qrRoot, input.dotScale ?? 1);
  namespaceIds(qrRoot, 'qr-');

  let q = QR_PX;
  const vb = qrRoot.getAttribute('viewBox');
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] && parts[2] > 0) q = parts[2];
  }
  const qrInner = qrRoot.innerHTML;

  const slot = input.frame.qrSlot;
  const scale = slot.w / q;

  const frameOpts: FrameRenderOpts = {
    frameColor: input.frameStyle.color,
    ctaText: input.frameStyle.ctaText,
    ctaColor: input.frameStyle.textColor,
    ctaSize: input.frameStyle.ctaSize,
    fontFamily: CTA_FONT,
  };
  const frameFragment = input.frame.cta || input.frame.id !== 'none' ? input.frame.render(frameOpts) : '';

  const hasText = !!input.additionalText && input.additionalText.text.length > 0;
  const masterH = FRAME_BLOCK_H + (hasText ? TEXT_BAND_H : 0);

  let textFragment = '';
  if (hasText && input.additionalText) {
    const t = input.additionalText;
    const baseline = FRAME_BLOCK_H + TEXT_BAND_H / 2 + t.size * 0.34;
    textFragment =
      `<text x="${MASTER_W / 2}" y="${baseline}" text-anchor="middle" ` +
      `font-family='${t.font}' font-size="${t.size}" font-weight="500" fill="${t.color}">${t.text}</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${MASTER_W} ${masterH}" width="${MASTER_W}" height="${masterH}">` +
    frameFragment +
    `<g transform="translate(${slot.x} ${slot.y}) scale(${scale.toFixed(5)})">${qrInner}</g>` +
    textFragment +
    `</svg>`;

  return { svg, width: MASTER_W, height: masterH };
}

/** Defense-in-depth sanitizer for the ONE place SVG enters the live DOM (preview
 *  innerHTML). Keeps the QR's <image> data-URL logo and filter defs; strips any
 *  script/foreignObject/event handlers. The export path does NOT use this — there the
 *  SVG is loaded as a non-scripting <img>, and we must not risk dropping the user's logo. */
export function sanitizeSvgForDom(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_DATA_URI_TAGS: ['image'],
    FORBID_TAGS: ['script', 'foreignObject'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseenter', 'onfocus'],
  });
}
