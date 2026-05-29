import { test, expect } from '@playwright/test';
import {
  gotoApp,
  readPreview,
  waitForPreview,
  expectPreviewToChange,
  fakeSvgAsPng,
  oversizedBuffer,
  realSvgBuffer,
} from './helpers';

test.describe('Security - uploads', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId('tab-logo').click();
  });

  test('rejects an SVG payload renamed to .png (magic-byte mismatch)', async ({ page }) => {
    await page.getByTestId('logo-input').setInputFiles({
      name: 'evil.png',
      mimeType: 'image/png',
      buffer: fakeSvgAsPng(),
    });
    await expect(page.getByTestId('logo-error')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('logo-settings')).toHaveCount(0);
    // No <image> and no script leaked into the preview.
    const svg = await readPreview(page);
    expect(/<image/i.test(svg)).toBe(false);
    expect(/<script/i.test(svg)).toBe(false);
  });

  test('rejects an oversized file', async ({ page }) => {
    await page.getByTestId('logo-input').setInputFiles({
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: oversizedBuffer(),
    });
    await expect(page.getByTestId('logo-error')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('logo-settings')).toHaveCount(0);
  });

  test('rejects a real SVG (type allow-list)', async ({ page }) => {
    await page.getByTestId('logo-input').setInputFiles({
      name: 'icon.svg',
      mimeType: 'image/svg+xml',
      buffer: realSvgBuffer(),
    });
    await expect(page.getByTestId('logo-error')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('logo-settings')).toHaveCount(0);
  });
});

test.describe('Security - text & content', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('XML-special chars in additional text are escaped, not injected', async ({ page }) => {
    await page.getByTestId('tab-text').click();
    await page.getByTestId('text-enable').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-text').fill('</text><script>alert(1)</script>&"\'');
    });
    const svg = await readPreview(page);
    // No live <script> element; the literal text is entity-escaped.
    expect(/<script/i.test(svg)).toBe(false);
    expect(svg).toContain('&lt;script&gt;');
  });

  test('a very long additional text does not break rendering', async ({ page }) => {
    await page.getByTestId('tab-text').click();
    await page.getByTestId('text-enable').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-text').fill('A'.repeat(5000));
    });
    expect(await readPreview(page)).toContain('<text');
    // The input itself is capped via maxLength.
    const val = await page.getByTestId('input-text').inputValue();
    expect(val.length).toBeLessThanOrEqual(120);
  });

  test('a javascript: payload triggers a soft warning but is NOT blocked', async ({ page }) => {
    await page.getByTestId('input-data').fill('javascript:alert(1)');
    await expect(page.getByTestId('notice-scheme')).toBeVisible({ timeout: 8000 });
    // Generation still proceeds - the QR is rendered.
    await waitForPreview(page);
    expect((await readPreview(page)).length).toBeGreaterThan(100);
  });

  test('CTA frame text with markup is escaped in the preview', async ({ page }) => {
    await page.getByTestId('tab-frames').click();
    await page.getByTestId('frame-rounded-band').click();
    await waitForPreview(page);
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-cta').fill('<b>x</b>');
    });
    const svg = await readPreview(page);
    expect(/<b>/i.test(svg)).toBe(false);
    expect(svg).toContain('&lt;b&gt;');
  });
});

test.describe('Security - CSP & isolation', () => {
  test('no third-party network requests; no CSP violations', async ({ page }) => {
    const external: string[] = [];
    const cspViolations: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        external.push(url);
      }
    });
    page.on('console', (msg) => {
      const t = msg.text();
      if (/content security policy|refused to/i.test(t)) cspViolations.push(t);
    });

    await gotoApp(page);
    // Exercise a logo + frame + text so all asset paths get touched.
    await page.getByTestId('tab-frames').click();
    await page.getByTestId('frame-dashed-playful').click();
    await waitForPreview(page);

    expect(external, `unexpected external requests: ${external.join(', ')}`).toEqual([]);
    expect(cspViolations, `CSP violations: ${cspViolations.join(' | ')}`).toEqual([]);
  });
});
