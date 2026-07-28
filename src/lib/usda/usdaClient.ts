import { getGtinUpc, mapUsdaFoodToProduct, parseUsdaSearchFoods } from './usdaTypes';
import type { Product, ProductSearchResult } from '../openfoodfacts/offTypes';

/**
 * Falls back to USDA's public DEMO_KEY (30 req/hour, 50/day per IP - fine
 * for trying the app out) when no real key is configured. Get a free,
 * un-rate-limited key at https://api.data.gov/signup/ and set
 * VITE_USDA_API_KEY in .env.local - see .env.example.
 */
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';
const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/**
 * USDA FoodData Central has no dedicated barcode-lookup endpoint (verified
 * against the live API) - a GTIN/UPC is matched by searching for its
 * zero-padded 14-digit GTIN-14 form as free text and checking each result's
 * own `gtinUpc` field for an exact match, since a partial/fuzzy text match
 * isn't good enough to treat as "this is the scanned product."
 */
export async function fetchProductByBarcodeFromUsda(barcode: string): Promise<Product | null> {
  const gtin14 = barcode.padStart(14, '0');
  const url = `${SEARCH_URL}?api_key=${encodeURIComponent(USDA_API_KEY)}&query=${encodeURIComponent(gtin14)}&pageSize=5`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const match = parseUsdaSearchFoods(body).find((food) => getGtinUpc(food) === gtin14);
    return match ? mapUsdaFoodToProduct(match, barcode) : null;
  } catch {
    return null;
  }
}

/** Name search fallback, tried only when Open Food Facts has zero matches - see productLookup.ts. */
export async function searchProductsByNameFromUsda(query: string): Promise<ProductSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed === '') return [];

  const url = `${SEARCH_URL}?api_key=${encodeURIComponent(USDA_API_KEY)}&query=${encodeURIComponent(trimmed)}&dataType=Branded&pageSize=20`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const body: unknown = await response.json();

    return parseUsdaSearchFoods(body)
      .map((food) => {
        const gtinUpc = getGtinUpc(food);
        return gtinUpc ? mapUsdaFoodToProduct(food, gtinUpc) : null;
      })
      .filter((p): p is Product => p !== null)
      .map((p) => ({
        code: p.code,
        name: p.name,
        brands: p.brands,
        imageUrl: p.imageUrl,
        nutriscoreGrade: p.nutriscoreGrade,
        source: p.source,
      }));
  } catch {
    return [];
  }
}
