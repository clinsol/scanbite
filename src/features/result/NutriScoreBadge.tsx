import { Badge } from '../../components/Badge';
import { presentNutriscoreGrade } from '../../lib/health/labelPresentation';
import type { Product } from '../../lib/openfoodfacts/offTypes';

interface NutriScoreBadgeProps {
  grade: Product['nutriscoreGrade'];
  source: Product['source'];
}

/** Independently field-safe: renders its own "not rated" state rather than assuming the rest of the product is complete. */
export function NutriScoreBadge({ grade, source }: NutriScoreBadgeProps) {
  const presentation = presentNutriscoreGrade(grade);

  if (!presentation || !grade) {
    return (
      <span className="text-sm text-ink-faint">
        {source === 'usda'
          ? "Not rated - Nutri-Score isn't computed by USDA FoodData Central"
          : 'Not rated by Open Food Facts'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge color={presentation.color}>{grade.toUpperCase()}</Badge>
      <span className="text-sm text-ink-muted">{presentation.label}</span>
    </div>
  );
}
