/**
 * Classifies Open Food Facts' own raw per-100g nutrient figures into
 * low/medium/high using the UK Food Standards Agency's published
 * front-of-pack traffic-light thresholds
 * (https://www.gov.uk/guidance/front-of-pack-nutrition-labelling-guidance)
 * - a cited, external methodology, not invented here. This is the one file
 * a reviewer can check to verify "is this threshold real," the same role
 * Civic's scoring/config.ts plays for its own ranges.
 */

export type NutrientBand = 'low' | 'medium' | 'high';
export type NutrientKind = 'sugar' | 'fat' | 'saturatedFat' | 'salt';

interface Thresholds {
  /** Values at or below this are "low." */
  lowMax: number;
  /** Values above lowMax and at or below this are "medium"; above this is "high." */
  mediumMax: number;
}

const THRESHOLDS: Record<NutrientKind, Thresholds> = {
  sugar: { lowMax: 5, mediumMax: 22.5 },
  fat: { lowMax: 3, mediumMax: 17.5 },
  saturatedFat: { lowMax: 1.5, mediumMax: 5 },
  salt: { lowMax: 0.3, mediumMax: 1.5 },
};

export function classifyNutrient(kind: NutrientKind, gramsPer100g: number | null): NutrientBand | null {
  if (gramsPer100g === null) return null;
  const { lowMax, mediumMax } = THRESHOLDS[kind];
  if (gramsPer100g <= lowMax) return 'low';
  if (gramsPer100g <= mediumMax) return 'medium';
  return 'high';
}

/**
 * 1 teaspoon of sugar is commonly approximated as 4g. Shown as an
 * additional, clearly-labeled equivalent next to the real gram figure from
 * OFF - never instead of it - so this stays a unit conversion of a real
 * number, not a fabricated one.
 */
export function sugarGramsToTeaspoons(grams: number): number {
  return grams / 4;
}
