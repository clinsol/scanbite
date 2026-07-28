import { expect, test } from '@playwright/test';
import { collectPageErrors, mockOpenFoodFacts, NOT_FOUND_BARCODE } from './fixtures';

test('a barcode Open Food Facts has no record of renders the honest not-found state', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await mockOpenFoodFacts(page);

  await page.goto(`/?barcode=${NOT_FOUND_BARCODE}`);

  await expect(page.getByText('Not in our database yet')).toBeVisible();
  await expect(page.getByText(NOT_FOUND_BARCODE)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scan a different product' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search by name instead' })).toBeVisible();

  const contributeLink = page.getByRole('link', { name: 'Add this product to Open Food Facts' });
  await expect(contributeLink).toHaveAttribute(
    'href',
    `https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${NOT_FOUND_BARCODE}`
  );
  await expect(contributeLink).toHaveAttribute('target', '_blank');

  expect(errors).toEqual([]);
});

test('"Search by name instead" from a not-found result opens the search tab', async ({ page }) => {
  await mockOpenFoodFacts(page);
  await page.goto(`/?barcode=${NOT_FOUND_BARCODE}`);

  await page.getByRole('button', { name: 'Search by name instead' }).click();

  await expect(page.getByPlaceholder(/Maggi noodles/)).toBeVisible();
});
