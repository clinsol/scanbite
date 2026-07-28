import { classifyNutrient, sugarGramsToTeaspoons, type NutrientKind } from '../../lib/health/nutrientBands';

interface NutrientRowProps {
  label: string;
  kind: NutrientKind;
  gramsPer100g: number | null;
  /** Shows the teaspoon equivalent alongside the real gram figure - sugar only. */
  showTeaspoons?: boolean;
}

const BAND_COLOR: Record<'low' | 'medium' | 'high', string> = {
  low: 'var(--color-good)',
  medium: 'var(--color-medium)',
  high: 'var(--color-poor)',
};

/** Independently field-safe - renders "not reported" rather than a fabricated 0 when OFF has no figure for this nutrient. */
export function NutrientRow({ label, kind, gramsPer100g, showTeaspoons }: NutrientRowProps) {
  if (gramsPer100g === null) {
    return (
      <div className="flex items-center justify-between border-b border-hairline py-2 text-sm">
        <span className="text-ink">{label}</span>
        <span className="text-ink-faint">Not reported</span>
      </div>
    );
  }

  const band = classifyNutrient(kind, gramsPer100g);

  return (
    <div className="flex items-center justify-between border-b border-hairline py-2 text-sm">
      <span className="text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-ink">
          {gramsPer100g}g per 100g
          {showTeaspoons && ` (~${sugarGramsToTeaspoons(gramsPer100g).toFixed(1)} tsp)`}
        </span>
        {band && (
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: BAND_COLOR[band] }}
            aria-label={`${band} ${label.toLowerCase()}`}
          />
        )}
      </div>
    </div>
  );
}
