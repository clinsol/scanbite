import type { Product } from '../../lib/openfoodfacts/offTypes';

interface IngredientsPanelProps {
  ingredientsText: string | null;
  source: Product['source'];
}

export function IngredientsPanel({ ingredientsText, source }: IngredientsPanelProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink">Ingredients</h3>
      {ingredientsText ? (
        <p className="text-sm text-ink-muted">{ingredientsText}</p>
      ) : (
        <p className="text-sm text-ink-faint">
          Not reported {source === 'usda' ? 'by USDA FoodData Central' : 'by Open Food Facts contributors'}
        </p>
      )}
    </div>
  );
}
