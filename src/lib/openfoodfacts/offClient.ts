import {
  parseLookupResponse,
  parseSearchResponse,
  type LookupResult,
  type ProductSearchResult,
} from './offTypes';

const PRODUCT_FIELDS =
  'code,product_name,brands,image_url,nutriscore_grade,nova_group,ingredients_text,allergens_tags,nutriments';

/**
 * Looks up a single product by its barcode against the free, no-auth Open
 * Food Facts API. Returns a discriminated union rather than throwing or
 * returning null, because "this barcode isn't catalogued" (permanent) and
 * "the request/response failed" (transient) need different user-facing
 * copy - see offTypes.ts LookupResult.
 */
export async function fetchProductByBarcode(barcode: string): Promise<LookupResult> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${PRODUCT_FIELDS}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return { type: 'error' };
  }
  if (!response.ok) return { type: 'error' };

  const body: unknown = await response.json();
  return parseLookupResponse(body);
}

/**
 * Name-based search fallback for when a barcode can't be scanned/typed, or
 * the user wants to try a different lookup after a not-found result.
 * Returns an empty array on any failure (network, non-2xx, unparseable
 * shape) - an empty results list already renders as an honest "no matches"
 * state in the UI, so a separate error variant isn't needed here the way
 * it is for the single-barcode lookup.
 */
export async function searchProductsByName(query: string): Promise<ProductSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed === '') return [];

  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?json=1&page_size=20` +
    `&search_terms=${encodeURIComponent(trimmed)}&fields=code,product_name,brands,image_url,nutriscore_grade`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const body: unknown = await response.json();
    return parseSearchResponse(body);
  } catch {
    return [];
  }
}
