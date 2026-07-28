import { expect, test } from '@playwright/test';
import { collectPageErrors, mockOpenFoodFacts } from './fixtures';

test('searching by name and picking a result renders the full product', async ({ page }) => {
  const errors = collectPageErrors(page);
  await mockOpenFoodFacts(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'enter it manually' }).click();
  await page.getByRole('button', { name: 'Search by name' }).click();
  await page.getByPlaceholder(/Maggi noodles/).fill('chocolate spread');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await page.getByRole('button', { name: /Test Chocolate Spread/ }).click();

  await expect(page.getByRole('heading', { name: 'Test Chocolate Spread' })).toBeVisible();

  expect(errors).toEqual([]);
});
