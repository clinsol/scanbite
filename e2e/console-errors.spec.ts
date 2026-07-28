import { expect, test } from '@playwright/test';
import { collectPageErrors, FOUND_BARCODE, mockOpenFoodFacts, NOT_FOUND_BARCODE } from './fixtures';

test('the scan-first home shell loads with no console errors or CSP violations', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await mockOpenFoodFacts(page);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Scanbite' })).toBeVisible();
  // camera access is expected to fail in this headless context (no real
  // camera/permission) - that itself must degrade to the documented
  // CameraPermissionNotice + manual entry fallback, not a thrown error.
  await expect(page.getByRole('button', { name: 'enter it manually' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('a found result page has no console errors or CSP violations', async ({ page }) => {
  const errors = collectPageErrors(page);
  await mockOpenFoodFacts(page);

  await page.goto(`/?barcode=${FOUND_BARCODE}`);
  await expect(page.getByRole('heading', { name: 'Test Chocolate Spread' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('a not-found result page has no console errors or CSP violations', async ({ page }) => {
  const errors = collectPageErrors(page);
  await mockOpenFoodFacts(page);

  await page.goto(`/?barcode=${NOT_FOUND_BARCODE}`);
  await expect(page.getByText('Not in our database yet')).toBeVisible();

  expect(errors).toEqual([]);
});
