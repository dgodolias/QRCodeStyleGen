import { test, expect } from '@playwright/test';
import {
  gotoApp,
  readPreview,
  waitForPreview,
  expectPreviewToChange,
  validPngBuffer,
} from './helpers';

const DOT_TYPES = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
const CSQ_TYPES = ['square', 'dot', 'extra-rounded'];

test.describe('Core features', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('tab switching shows the right panel', async ({ page }) => {
    await page.getByTestId('tab-shapes').click();
    await expect(page.getByTestId('panel-shapes')).toBeVisible();

    await page.getByTestId('tab-frames').click();
    await expect(page.getByTestId('panel-frames')).toBeVisible();
    await expect(page.getByTestId('panel-shapes')).toHaveCount(0);

    await page.getByTestId('tab-logo').click();
    await expect(page.getByTestId('panel-logo')).toBeVisible();

    await page.getByTestId('tab-text').click();
    await expect(page.getByTestId('panel-text')).toBeVisible();
  });

  test('changing the data updates the preview', async ({ page }) => {
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-data').fill('https://example.com/changed');
    });
  });

  test('each dot type re-renders the QR', async ({ page }) => {
    await page.getByTestId('tab-shapes').click();
    let prev = await readPreview(page);
    for (const t of DOT_TYPES) {
      await page.getByTestId(`dot-${t}`).click();
      await expect
        .poll(async () => (await readPreview(page)) !== prev, { timeout: 8000 })
        .toBe(true);
      prev = await readPreview(page);
      expect(prev.length).toBeGreaterThan(100);
    }
  });

  test('each corner-frame type re-renders the QR', async ({ page }) => {
    await page.getByTestId('tab-shapes').click();
    let prev = await readPreview(page);
    for (const t of CSQ_TYPES) {
      await page.getByTestId(`csq-${t}`).click();
      await expect
        .poll(async () => (await readPreview(page)) !== prev, { timeout: 8000 })
        .toBe(true);
      prev = await readPreview(page);
    }
  });

  test('dot color change appears in the SVG fill', async ({ page }) => {
    await page.getByTestId('tab-shapes').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('dots-fill-color').fill('#ff0066');
    });
    expect((await readPreview(page)).toLowerCase()).toContain('#ff0066');
  });

  test('dot spacing slider changes the rendered dots', async ({ page }) => {
    await page.getByTestId('tab-shapes').click();
    await page.getByTestId('dot-square').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('dot-spacing').fill('20');
    });
    // A shrink transform is injected onto the data dots.
    expect((await readPreview(page)).toLowerCase()).toContain('scale(');
  });

  test('gradient toggle injects a gradient element', async ({ page }) => {
    await page.getByTestId('tab-shapes').click();
    await page.getByTestId('dots-fill-gradient').click();
    await waitForPreview(page);
    await expect
      .poll(async () => /<lineargradient|<radialgradient/i.test(await readPreview(page)), {
        timeout: 8000,
      })
      .toBe(true);
  });

  test('applying a frame adds frame markup + CTA text, and records "recently used"', async ({ page }) => {
    await page.getByTestId('tab-frames').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('frame-rounded-band').click();
    });
    // CTA controls appear; editing the text reflects in the preview.
    await expect(page.getByTestId('frame-cta-controls')).toBeVisible();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-cta').fill('SCAN HERE');
    });
    expect(await readPreview(page)).toContain('SCAN HERE');

    // Recently used now lists the frame.
    await page.getByTestId('frame-filter-recent').click();
    await expect(page.getByTestId('frame-rounded-band')).toBeVisible();
  });

  test('additional text renders with chosen size', async ({ page }) => {
    await page.getByTestId('tab-text').click();
    await page.getByTestId('text-enable').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-text').fill('Visit our shop');
    });
    const svg = await readPreview(page);
    expect(svg).toContain('Visit our shop');
    expect(svg).toContain('<text');
  });

  test('valid PNG logo is embedded as an <image>', async ({ page }) => {
    await page.getByTestId('tab-logo').click();
    await page.getByTestId('logo-input').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: validPngBuffer(),
    });
    await expect(page.getByTestId('logo-settings')).toBeVisible({ timeout: 8000 });
    await expect
      .poll(async () => /<image/i.test(await readPreview(page)), { timeout: 8000 })
      .toBe(true);
    // Adding a logo auto-raised error correction to H.
    await expect(page.getByTestId('ecl-H')).toHaveClass(/active/);
  });

  test('built-in icon can be used as a logo', async ({ page }) => {
    await page.getByTestId('tab-logo').click();
    await page.getByTestId('icon-wifi').click();
    await expect(page.getByTestId('logo-settings')).toBeVisible({ timeout: 8000 });
    await expect
      .poll(async () => /<image/i.test(await readPreview(page)), { timeout: 8000 })
      .toBe(true);
  });
});

test.describe('Downloads', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  for (const fmt of ['png', 'svg', 'jpeg'] as const) {
    test(`downloads a ${fmt.toUpperCase()} file`, async ({ page }) => {
      const ext = fmt === 'jpeg' ? 'jpg' : fmt;
      // Pick the format, then hit the single explicit Download button.
      await page.getByTestId(`format-${fmt}`).click();
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        page.getByTestId('download-button').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${ext}$`));
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const c of stream) chunks.push(c as Buffer);
      const buf = Buffer.concat(chunks);
      expect(buf.length).toBeGreaterThan(100);
      if (fmt === 'svg') expect(buf.toString('utf8')).toContain('<svg');
      if (fmt === 'png') expect(buf.subarray(0, 4).toString('hex')).toBe('89504e47');
      if (fmt === 'jpeg') expect(buf.subarray(0, 3).toString('hex')).toBe('ffd8ff');
    });
  }
});
