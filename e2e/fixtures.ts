import type { Page } from '@playwright/test';

export const FOUND_BARCODE = '3017620422003';
export const NOT_FOUND_BARCODE = '0000000000017';

const FOUND_PRODUCT_RESPONSE = {
  status: 1,
  product: {
    code: FOUND_BARCODE,
    product_name: 'Test Chocolate Spread',
    brands: 'TestBrand',
    image_url: null,
    nutriscore_grade: 'e',
    nova_group: 4,
    ingredients_text: 'sugar, palm oil, hazelnuts 13%',
    allergens_tags: ['en:milk', 'en:nuts'],
    nutriments: {
      sugars_100g: 56.3,
      salt_100g: 0.107,
      fat_100g: 30.9,
      'saturated-fat_100g': 10.6,
    },
  },
};

const NOT_FOUND_RESPONSE = { status: 0, status_verbose: 'product not found' };

const SEARCH_RESPONSE = {
  products: [
    {
      code: FOUND_BARCODE,
      product_name: 'Test Chocolate Spread',
      brands: 'TestBrand',
      image_url: null,
      nutriscore_grade: 'e',
    },
  ],
};

const USDA_EMPTY_RESPONSE = { foods: [] };

/**
 * Mocks Scanbite's two external APIs (Open Food Facts, and its USDA
 * FoodData Central fallback - see docs/architecture.md "Two-source
 * lookup") so E2E specs exercise the real browser/React integration surface
 * without depending on either real, free service - the same boundary the
 * unit tests mock, just one layer further out. USDA is mocked to always
 * come back empty here: these fixtures test OFF's own found/not-found/
 * search behavior, and the not-found flow must stay deterministic rather
 * than depending on whatever USDA's live, rate-limited DEMO_KEY happens to
 * return. USDA-specific fallback behavior is covered by
 * productLookup.test.ts instead. See docs/qa-strategy.md.
 */
export async function mockOpenFoodFacts(page: Page) {
  await page.route(
    `**://world.openfoodfacts.org/api/v2/product/${FOUND_BARCODE}.json**`,
    (route) => route.fulfill({ json: FOUND_PRODUCT_RESPONSE })
  );
  await page.route(
    `**://world.openfoodfacts.org/api/v2/product/${NOT_FOUND_BARCODE}.json**`,
    (route) => route.fulfill({ json: NOT_FOUND_RESPONSE })
  );
  await page.route('**://world.openfoodfacts.org/cgi/search.pl**', (route) =>
    route.fulfill({ json: SEARCH_RESPONSE })
  );
  await page.route('**://api.nal.usda.gov/fdc/v1/foods/search**', (route) =>
    route.fulfill({ json: USDA_EMPTY_RESPONSE })
  );
}

/** Collects console errors and uncaught page errors - the way a CSP violation or a runtime error would actually surface. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}
