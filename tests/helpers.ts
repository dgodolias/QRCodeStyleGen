import { type Page, expect } from '@playwright/test';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

// A genuine, decodable 1×1 PNG (valid magic + IHDR/IDAT/IEND) for the "valid upload" path.
const VALID_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function validPngBuffer(): Buffer {
  return Buffer.from(VALID_PNG_B64, 'base64');
}

/** Bytes that are SVG (XSS-capable) but uploaded as image/png with a .png name. */
export function fakeSvgAsPng(): Buffer {
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>');
}

/** >2MB buffer (size check fires before anything else). */
export function oversizedBuffer(): Buffer {
  return Buffer.alloc(3 * 1024 * 1024, 0x89);
}

/** A real (small) SVG uploaded with the correct image/svg+xml MIME → rejected by allow-list. */
export function realSvgBuffer(): Buffer {
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
}

export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('preview-stage')).toBeVisible();
  await waitForPreview(page);
}

/** Inner HTML of the live preview SVG container (empty string if not yet rendered). */
export async function readPreview(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="preview-svg"]');
    return el ? el.innerHTML : '';
  });
}

/** Wait until the preview SVG is present and non-trivial. */
export async function waitForPreview(page: Page): Promise<void> {
  await expect
    .poll(async () => (await readPreview(page)).length, { timeout: 8000 })
    .toBeGreaterThan(100);
}

/** Run an action, then wait until the preview markup actually changes (debounce-safe). */
export async function expectPreviewToChange(page: Page, action: () => Promise<void>): Promise<void> {
  const before = await readPreview(page);
  await action();
  await expect
    .poll(async () => (await readPreview(page)) !== before, { timeout: 8000 })
    .toBe(true);
}

/** Wait until the preview markup stops changing for `quietMs` (handles multi-step
 *  rebuilds, e.g. logo upload → automatic ECL raise → second re-render). */
export async function waitForPreviewStable(page: Page, quietMs = 400): Promise<void> {
  let last = await readPreview(page);
  await expect
    .poll(
      async () => {
        await page.waitForTimeout(quietMs);
        const now = await readPreview(page);
        const stable = now === last && now.length > 100;
        last = now;
        return stable;
      },
      { timeout: 10000 },
    )
    .toBe(true);
}

/** Download a generated file by clicking its button and return the bytes. */
export async function downloadBuffer(page: Page, testId: string): Promise<Buffer> {
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.getByTestId(testId).click(),
  ]);
  const stream = await dl.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

/** Decode a PNG buffer with jsQR, flattening any transparency onto white first
 *  (jsQR ignores alpha, so transparent PNGs must be composited or it reads garbage). */
export function decodePngBuffer(buf: Buffer): string | null {
  const img = PNG.sync.read(buf);
  const flat = new Uint8ClampedArray(img.width * img.height * 4);
  for (let i = 0; i < img.data.length; i += 4) {
    const a = img.data[i + 3]! / 255;
    flat[i] = Math.round(img.data[i]! * a + 255 * (1 - a));
    flat[i + 1] = Math.round(img.data[i + 1]! * a + 255 * (1 - a));
    flat[i + 2] = Math.round(img.data[i + 2]! * a + 255 * (1 - a));
    flat[i + 3] = 255;
  }
  const code = jsQR(flat, img.width, img.height);
  return code ? code.data : null;
}

/** Set the export resolution, download the real PNG artifact, and decode it.
 *  Settles the preview first so we never export a half-built master.
 *  This tests the ACTUAL downloadable output, not a re-rasterized preview.
 *
 *  Default scale is 1 (1000px — already high resolution). jsQR's binarizer is less
 *  robust than real phone scanners and mis-reads heavily anti-aliased circular "dots"
 *  at 2000px+; 1000px decodes cleanly for every style. The point of the test is to
 *  prove the QR PATTERN is valid, not to benchmark jsQR's anti-alias tolerance. */
export async function decodeExportedPng(page: Page, scale = 1): Promise<string | null> {
  await waitForPreviewStable(page);
  await page.getByTestId(`scale-${scale}`).click();
  const buf = await downloadBuffer(page, 'download-png');
  return decodePngBuffer(buf);
}
