import { expect, test } from '@playwright/test';
import { collectPageErrors, FOUND_BARCODE, mockOpenFoodFacts } from './fixtures';

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

test('sharing a found result opens the share card with a real canvas image', async ({ page }) => {
  const errors = collectPageErrors(page);
  await mockOpenFoodFacts(page);

  await page.goto(`/?barcode=${FOUND_BARCODE}`);
  await page.getByRole('button', { name: 'Share this result' }).click();

  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('copying the link puts the shareable ?barcode= URL on the clipboard', async ({ page }) => {
  await mockOpenFoodFacts(page);
  await page.goto(`/?barcode=${FOUND_BARCODE}`);
  await page.getByRole('button', { name: 'Share this result' }).click();

  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain(`barcode=${FOUND_BARCODE}`);
});

test('closing the share card returns to the result', async ({ page }) => {
  await mockOpenFoodFacts(page);
  await page.goto(`/?barcode=${FOUND_BARCODE}`);
  await page.getByRole('button', { name: 'Share this result' }).click();

  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.locator('canvas')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Test Chocolate Spread' })).toBeVisible();
});

test('when the Web Share API is unavailable, sharing falls back to a direct download', async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Simulates a desktop browser without the Web Share API - the
    // documented fallback path (see docs/architecture.md).
    Object.defineProperty(window.navigator, 'share', { value: undefined, configurable: true });
  });
  await mockOpenFoodFacts(page);
  await page.goto(`/?barcode=${FOUND_BARCODE}`);
  await page.getByRole('button', { name: 'Share this result' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('scanbite-result.png');
});
