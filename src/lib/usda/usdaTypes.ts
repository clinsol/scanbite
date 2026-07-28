import type { Product } from '../openfoodfacts/offTypes';

/**
 * USDA FoodData Central nutrient codes (its stable `nutrientNumber`, not the
 * unstable-looking `nutrientId`) for the same four fields OFF reports.
 * Verified against a real live search response (General Mills Cheerios,
 * fdcId 2517161) - see docs/architecture.md for how this was checked before
 * being shipped, the same discipline as `health/nutrientBands.ts`'s FSA
 * thresholds.
 */
const NUTRIENT_NUMBER = {
  fat: '204',
  sugars: '269',
  saturatedFat: '606',
  sodium: '307',
  energyKcal: '208',
} as const;

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function findNutrientValue(foodNutrients: unknown, nutrientNumber: string): number | null {
  if (!Array.isArray(foodNutrients)) return null;
  const match = foodNutrients.find(
    (n): n is { nutrientNumber?: unknown; value?: unknown } =>
      typeof n === 'object' && n !== null && (n as { nutrientNumber?: unknown }).nutrientNumber === nutrientNumber
  );
  return match ? numberOrNull(match.value) : null;
}

/** USDA reports sodium in mg, not a "salt" figure - this is the standard, widely-used sodium-to-salt conversion (salt = sodium x 2.5), applied only when a real sodium value exists. */
function saltFromSodiumMg(sodiumMg: number | null): number | null {
  return sodiumMg === null ? null : (sodiumMg * 2.5) / 1000;
}

function parseUsdaNutrients(foodNutrients: unknown): Product['nutrients'] {
  return {
    sugars100g: findNutrientValue(foodNutrients, NUTRIENT_NUMBER.sugars),
    salt100g: saltFromSodiumMg(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.sodium)),
    fat100g: findNutrientValue(foodNutrients, NUTRIENT_NUMBER.fat),
    saturatedFat100g: findNutrientValue(foodNutrients, NUTRIENT_NUMBER.saturatedFat),
    energyKcal100g: findNutrientValue(foodNutrients, NUTRIENT_NUMBER.energyKcal),
  };
}

/** Extracts the `foods` array from a `/foods/search` response body without assuming its shape - same runtime-validation discipline as offTypes.ts, since this is also a free API that can drift. */
export function parseUsdaSearchFoods(body: unknown): unknown[] {
  if (typeof body !== 'object' || body === null) return [];
  const { foods } = body as { foods?: unknown };
  return Array.isArray(foods) ? foods : [];
}

export function getGtinUpc(rawFood: unknown): string | null {
  if (typeof rawFood !== 'object' || rawFood === null) return null;
  return stringOrNull((rawFood as { gtinUpc?: unknown }).gtinUpc);
}

/**
 * Maps one raw USDA branded-food record into this app's shared `Product`
 * shape. `code` is passed in by the caller rather than derived from
 * `gtinUpc` here: a barcode lookup already knows the exact scanned/typed
 * code (avoids re-deriving it from USDA's zero-padded 14-digit GTIN, which
 * would risk stripping a barcode's own legitimate leading zero); a
 * name-search result has no scanned code yet, so the caller passes the raw
 * `gtinUpc` instead.
 *
 * USDA never computes a Nutri-Score or NOVA group (those are OFF's own
 * methodologies) and has no structured allergen tagging or product image in
 * its branded-food records - each renders through the same per-field
 * "not reported" UI states real OFF gaps already use, not a special case.
 */
export function mapUsdaFoodToProduct(rawFood: unknown, code: string): Product | null {
  if (typeof rawFood !== 'object' || rawFood === null) return null;
  const f = rawFood as { description?: unknown; brandOwner?: unknown; ingredients?: unknown; foodNutrients?: unknown };

  return {
    code,
    name: stringOrNull(f.description),
    brands: stringOrNull(f.brandOwner),
    imageUrl: null,
    nutriscoreGrade: null,
    novaGroup: null,
    ingredientsText: stringOrNull(f.ingredients),
    allergens: [],
    nutrients: parseUsdaNutrients(f.foodNutrients),
    source: 'usda',
  };
}
