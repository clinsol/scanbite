import type { Product } from '../../lib/openfoodfacts/offTypes';

interface AllergensListProps {
  allergens: string[];
  source: Product['source'];
}

export function AllergensList({ allergens, source }: AllergensListProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink">Allergens</h3>
      {allergens.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {allergens.map((allergen) => (
            <li
              key={allergen}
              className="rounded-full bg-surface-sunken px-3 py-1 text-xs capitalize text-ink-muted"
            >
              {allergen}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-faint">
          None reported {source === 'usda' ? 'by USDA FoodData Central' : 'by Open Food Facts contributors'}
        </p>
      )}
    </div>
  );
}
