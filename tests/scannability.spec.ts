import { test, expect } from '@playwright/test';
import { gotoApp, expectPreviewToChange, decodeExportedPng, validPngBuffer } from './helpers';

// The whole point of a styled QR is that it still SCANS. We decode the actual exported
// PNG with jsQR and assert it returns the exact payload - across dot styles,
// error-correction levels, and with a center logo (the riskiest case).
//
// We wrap every config change in expectPreviewToChange so the (debounced) master SVG
// has actually rebuilt before we export - otherwise we'd download a stale artifact.

const PAYLOAD = 'https://example.com/scan-check-7Q';

test.describe('Scannability', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-data').fill(PAYLOAD);
    });
  });

  for (const dot of ['square', 'dots', 'classy-rounded']) {
    test(`decodes with dot style "${dot}"`, async ({ page }) => {
      await page.getByTestId('tab-shapes').click();
      await expectPreviewToChange(page, async () => {
        await page.getByTestId(`dot-${dot}`).click();
      });
      expect(await decodeExportedPng(page)).toBe(PAYLOAD);
    });
  }

  test('decodes with a moderate dot spacing gap', async ({ page }) => {
    await page.getByTestId('tab-shapes').click();
    await page.getByTestId('dot-square').click();
    // 15% gap (dotScale 0.85) - within the verified-scannable range.
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('dot-spacing').fill('15');
    });
    expect(await decodeExportedPng(page)).toBe(PAYLOAD);
  });

  // Default ECL is Q; only assert "changed" for the levels that differ from it.
  for (const ecl of ['L', 'M', 'H'] as const) {
    test(`decodes at error-correction level ${ecl}`, async ({ page }) => {
      await expectPreviewToChange(page, async () => {
        await page.getByTestId(`ecl-${ecl}`).click();
      });
      expect(await decodeExportedPng(page)).toBe(PAYLOAD);
    });
  }

  test('decodes at error-correction level Q (default)', async ({ page }) => {
    // Already Q after beforeEach; just export and decode.
    expect(await decodeExportedPng(page)).toBe(PAYLOAD);
  });

  test('decodes with a center logo (auto ECL=H)', async ({ page }) => {
    await page.getByTestId('tab-logo').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('logo-input').setInputFiles({
        name: 'logo.png',
        mimeType: 'image/png',
        buffer: validPngBuffer(),
      });
    });
    await expect(page.getByTestId('logo-settings')).toBeVisible({ timeout: 8000 });
    expect(await decodeExportedPng(page)).toBe(PAYLOAD);
  });

  test('decodes inside a frame with additional text', async ({ page }) => {
    await page.getByTestId('tab-frames').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('frame-rounded-band').click();
    });
    await page.getByTestId('tab-text').click();
    await page.getByTestId('text-enable').click();
    await expectPreviewToChange(page, async () => {
      await page.getByTestId('input-text').fill('Scan me');
    });
    expect(await decodeExportedPng(page)).toBe(PAYLOAD);
  });
});
