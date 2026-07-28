import { fetchProductByBarcode, searchProductsByName } from '../openfoodfacts/offClient';
import type { LookupResult, ProductSearchResult } from '../openfoodfacts/offTypes';
import { fetchProductByBarcodeFromUsda, searchProductsByNameFromUsda } from '../usda/usdaClient';

/**
 * Open Food Facts stays the primary source (it's the one with real
 * Nutri-Score/NOVA data); USDA FoodData Central is a pure additive
 * fallback, tried only when OFF didn't already produce a "found" result -
 * see docs/architecture.md "Two-source lookup" for the full reasoning.
 *
 * OFF's own `not_found` is treated as an authoritative permanent verdict:
 * if USDA's fallback attempt itself fails (network/parse), that doesn't
 * turn a confirmed not_found into an error - USDA had nothing to add
 * either way. But if OFF itself couldn't be reached (`error`, a transient
 * failure, not a verdict), a USDA miss still leaves the real answer
 * unknown, so `error` is preserved rather than downgraded to not_found.
 */
export async function lookupProduct(barcode: string): Promise<LookupResult> {
  const offResult = await fetchProductByBarcode(barcode);
  if (offResult.type === 'found') return offResult;

  const usdaProduct = await fetchProductByBarcodeFromUsda(barcode);
  if (usdaProduct) return { type: 'found', product: usdaProduct };

  return offResult;
}

/** Only checks USDA when OFF returns zero matches - OFF's results already carry richer data (Nutri-Score) when available. */
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const offResults = await searchProductsByName(query);
  if (offResults.length > 0) return offResults;

  return searchProductsByNameFromUsda(query);
}
