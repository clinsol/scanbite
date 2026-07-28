import { expect, test } from '@playwright/test';
import { collectPageErrors, FOUND_BARCODE, mockOpenFoodFacts } from './fixtures';

test('typing a valid barcode manually renders a full found result, with no console/CSP errors', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await mockOpenFoodFacts(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'enter it manually' }).click();
  await page.getByPlaceholder(/8901058851226/).fill(FOUND_BARCODE);
  await page.getByRole('button', { name: 'Look up' }).click();

  await expect(page.getByRole('heading', { name: 'Test Chocolate Spread' })).toBeVisible();
  await expect(page.getByText('TestBrand')).toBeVisible();
  await expect(page.getByText('Poor nutritional quality')).toBeVisible();
  await expect(page.getByText('Ultra-processed food')).toBeVisible();
  await expect(page.getByText(/56\.3g per 100g/)).toBeVisible();

  // the URL is now shareable/bookmarkable, per docs/architecture.md
  expect(page.url()).toContain(`barcode=${FOUND_BARCODE}`);

  expect(errors).toEqual([]);
});

test('an invalid (checksum-wrong) barcode is rejected locally, before any lookup', async ({
  page,
}) => {
  await mockOpenFoodFacts(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'enter it manually' }).click();
  await page.getByPlaceholder(/8901058851226/).fill('1234567890123');
  await page.getByRole('button', { name: 'Look up' }).click();

  await expect(page.getByText(/doesn't look like a valid barcode/)).toBeVisible();
});
