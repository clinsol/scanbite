/**
 * Pure presentation lookup for Open Food Facts' own nutriscore_grade and
 * nova_group values - color + one-line plain-English description only.
 * This never changes the letter/number OFF reports; it only styles it.
 * Both null cases (field missing/unrated in OFF) map to an honest
 * "not rated" state, never a default color that would imply a fabricated
 * grade.
 */

export interface GradePresentation {
  color: string;
  label: string;
}

const NUTRISCORE_PRESENTATION: Record<'a' | 'b' | 'c' | 'd' | 'e', GradePresentation> = {
  a: { color: '#1e7d32', label: 'Best nutritional quality' },
  b: { color: '#66bb6a', label: 'Good nutritional quality' },
  c: { color: '#fbc02d', label: 'Moderate nutritional quality' },
  d: { color: '#f57c00', label: 'Lower nutritional quality' },
  e: { color: '#c62828', label: 'Poor nutritional quality' },
};

export function presentNutriscoreGrade(
  grade: 'a' | 'b' | 'c' | 'd' | 'e' | null
): GradePresentation | null {
  return grade === null ? null : NUTRISCORE_PRESENTATION[grade];
}

const NOVA_PRESENTATION: Record<1 | 2 | 3 | 4, GradePresentation> = {
  1: { color: '#1e7d32', label: 'Unprocessed or minimally processed' },
  2: { color: '#9ccc65', label: 'Processed culinary ingredient' },
  3: { color: '#fb8c00', label: 'Processed food' },
  4: { color: '#c62828', label: 'Ultra-processed food' },
};

export function presentNovaGroup(group: 1 | 2 | 3 | 4 | null): GradePresentation | null {
  return group === null ? null : NOVA_PRESENTATION[group];
}
