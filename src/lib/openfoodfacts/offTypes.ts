/**
 * Normalized shape this app actually renders. Every field is optional
 * except `code` because Open Food Facts (OFF) is community-contributed -
 * a "found" product can still be missing ingredients, an image, or any
 * given nutrient. Each consumer of this type must render its own field's
 * absence honestly instead of assuming the rest of the object is complete.
 */
/** Which live database this product's data actually came from - shown to the user because the two sources have different capabilities (only OFF computes Nutri-Score/NOVA), not an implementation detail to hide. */
export type ProductSource = 'openfoodfacts' | 'usda';

export interface Product {
  code: string;
  name: string | null;
  brands: string | null;
  imageUrl: string | null;
  /** OFF's own computed grade, 'a' (best) to 'e' (worst) - rendered verbatim, never recomputed. */
  nutriscoreGrade: 'a' | 'b' | 'c' | 'd' | 'e' | null;
  /** OFF's own computed NOVA processing group, 1 (unprocessed) to 4 (ultra-processed) - rendered verbatim. */
  novaGroup: 1 | 2 | 3 | 4 | null;
  ingredientsText: string | null;
  /** Human-readable allergen names (OFF's `en:milk` style tags cleaned up), not raw tag codes. */
  allergens: string[];
  nutrients: {
    sugars100g: number | null;
    salt100g: number | null;
    fat100g: number | null;
    saturatedFat100g: number | null;
    energyKcal100g: number | null;
  };
  source: ProductSource;
}

/** A lightweight row for name-search results, before the user picks one to load in full. */
export interface ProductSearchResult {
  code: string;
  name: string | null;
  brands: string | null;
  imageUrl: string | null;
  nutriscoreGrade: 'a' | 'b' | 'c' | 'd' | 'e' | null;
  source: ProductSource;
}

interface RawNutriments {
  sugars_100g?: unknown;
  salt_100g?: unknown;
  fat_100g?: unknown;
  'saturated-fat_100g'?: unknown;
  'energy-kcal_100g'?: unknown;
}

interface RawProduct {
  code?: unknown;
  product_name?: unknown;
  brands?: unknown;
  image_url?: unknown;
  nutriscore_grade?: unknown;
  nova_group?: unknown;
  ingredients_text?: unknown;
  allergens_tags?: unknown;
  nutriments?: unknown;
}

interface RawLookupResponse {
  status?: unknown;
  product?: unknown;
}

interface RawSearchResponse {
  products?: unknown;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

const NUTRISCORE_GRADES = ['a', 'b', 'c', 'd', 'e'] as const;
function nutriscoreGradeOrNull(value: unknown): Product['nutriscoreGrade'] {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  return (NUTRISCORE_GRADES as readonly string[]).includes(lower)
    ? (lower as Product['nutriscoreGrade'])
    : null;
}

function novaGroupOrNull(value: unknown): Product['novaGroup'] {
  const n = numberOrNull(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}

/** OFF allergen tags look like "en:milk" or "en:gluten" - strips the language prefix and underscores. */
function humanizeAllergenTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '))
    .filter((tag) => tag.length > 0);
}

function parseNutrients(raw: unknown): Product['nutrients'] {
  const n = (typeof raw === 'object' && raw !== null ? raw : {}) as RawNutriments;
  return {
    sugars100g: numberOrNull(n.sugars_100g),
    salt100g: numberOrNull(n.salt_100g),
    fat100g: numberOrNull(n.fat_100g),
    saturatedFat100g: numberOrNull(n['saturated-fat_100g']),
    energyKcal100g: numberOrNull(n['energy-kcal_100g']),
  };
}

/**
 * Runtime shape check + normalization, not just a compile-time type
 * assertion - OFF is a free, community-run API that can drift its response
 * shape without warning (same discipline as this project's own
 * openfoodfacts precedent in Civic's WAQI wrapper). Returns null when the
 * body doesn't have at least a barcode to key off of; every other field
 * degrades independently to null/empty rather than throwing.
 */
export function parseProduct(raw: unknown): Product | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as RawProduct;
  const code = stringOrNull(p.code);
  if (code === null) return null;

  return {
    code,
    name: stringOrNull(p.product_name),
    brands: stringOrNull(p.brands),
    imageUrl: stringOrNull(p.image_url),
    nutriscoreGrade: nutriscoreGradeOrNull(p.nutriscore_grade),
    novaGroup: novaGroupOrNull(p.nova_group),
    ingredientsText: stringOrNull(p.ingredients_text),
    allergens: humanizeAllergenTags(p.allergens_tags),
    nutrients: parseNutrients(p.nutriments),
    source: 'openfoodfacts',
  };
}

export type LookupResult =
  | { type: 'found'; product: Product }
  | { type: 'not_found' }
  | { type: 'error' };

/**
 * Distinguishes "OFF has no record of this barcode" (status: 0, a
 * permanent outcome) from "the response didn't parse" (a transient/API
 * -drift outcome) - the user-facing copy for these two cases needs to be
 * different, so they can't collapse into one null the way Civic's simpler
 * WAQI wrapper does.
 */
export function parseLookupResponse(body: unknown): LookupResult {
  if (typeof body !== 'object' || body === null) return { type: 'error' };
  const { status, product } = body as RawLookupResponse;
  if (status === 0) return { type: 'not_found' };
  if (status !== 1) return { type: 'error' };

  const parsed = parseProduct(product);
  return parsed ? { type: 'found', product: parsed } : { type: 'error' };
}

export function parseSearchResponse(body: unknown): ProductSearchResult[] {
  if (typeof body !== 'object' || body === null) return [];
  const { products } = body as RawSearchResponse;
  if (!Array.isArray(products)) return [];

  return products
    .map((raw) => parseProduct(raw))
    .filter((p): p is Product => p !== null)
    .map((p) => ({
      code: p.code,
      name: p.name,
      brands: p.brands,
      imageUrl: p.imageUrl,
      nutriscoreGrade: p.nutriscoreGrade,
      source: p.source,
    }));
}
