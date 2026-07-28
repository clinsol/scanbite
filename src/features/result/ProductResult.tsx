import type { LookupResult, Product } from '../../lib/openfoodfacts/offTypes';
import { NutriScoreBadge } from './NutriScoreBadge';
import { NovaBadge } from './NovaBadge';
import { NutrientRow } from './NutrientRow';
import { IngredientsPanel } from './IngredientsPanel';
import { AllergensList } from './AllergensList';
import { NotFoundPanel } from './NotFoundPanel';
import { ScoreLegend } from '../../components/ScoreLegend';

interface ProductResultProps {
  isLoading: boolean;
  result: LookupResult | null;
  barcode: string;
  onRetry: () => void;
  onScanAnother: () => void;
  onSearchInstead: () => void;
  onShare: (product: Product) => void;
}

/**
 * Owns all 4 states a lookup can be in - loading / not_found / error /
 * found - the direct analog of Civic's HeroCard. A regression here (e.g.
 * an unhandled state silently rendering nothing) is the most visible
 * possible bug, so every branch is explicit rather than falling through to
 * a default.
 */
export function ProductResult({
  isLoading,
  result,
  barcode,
  onRetry,
  onScanAnother,
  onSearchInstead,
  onShare,
}: ProductResultProps) {
  if (isLoading) {
    return (
      <div data-testid="product-result-loading" className="card space-y-4 p-5">
        <div className="flex items-center gap-4">
          <div className="skeleton-shimmer h-20 w-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-5 w-2/3 rounded" />
            <div className="skeleton-shimmer h-4 w-1/3 rounded" />
          </div>
        </div>
        <div className="skeleton-shimmer h-16 rounded-lg" />
        <div className="skeleton-shimmer h-6 w-full rounded" />
        <div className="skeleton-shimmer h-6 w-5/6 rounded" />
      </div>
    );
  }

  if (result === null) return null;

  if (result.type === 'not_found') {
    return (
      <NotFoundPanel
        barcode={barcode}
        onScanAnother={onScanAnother}
        onSearchInstead={onSearchInstead}
      />
    );
  }

  if (result.type === 'error') {
    return (
      <div data-testid="product-result-error" className="card p-6 text-center">
        <p className="mb-4 text-sm text-ink-muted">
          Couldn&apos;t reach our data sources right now - this is a network hiccup, not a
          statement about the product.
        </p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256b29]"
        >
          Try again
        </button>
      </div>
    );
  }

  const { product } = result;

  return (
    <div data-testid="product-result-found" className="space-y-4">
      <div className="card space-y-5 p-5">
        <div className="flex items-start gap-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name ?? 'Product'}
              className="h-20 w-20 shrink-0 rounded-lg border border-hairline object-contain"
            />
          ) : (
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-xs text-ink-faint"
              aria-hidden
            >
              No image
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-balance text-ink">
              {product.name ?? 'Unnamed product'}
            </h2>
            {product.brands && <p className="text-sm text-ink-faint">{product.brands}</p>}
            <p className="mt-1 text-xs text-ink-faint">
              Data from {product.source === 'usda' ? 'USDA FoodData Central' : 'Open Food Facts'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-sunken p-3">
            <NutriScoreBadge grade={product.nutriscoreGrade} source={product.source} />
          </div>
          <div className="rounded-lg bg-surface-sunken p-3">
            <NovaBadge group={product.novaGroup} source={product.source} />
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-ink">Per 100g</h3>
          <NutrientRow
            label="Sugar"
            kind="sugar"
            gramsPer100g={product.nutrients.sugars100g}
            showTeaspoons
          />
          <NutrientRow label="Fat" kind="fat" gramsPer100g={product.nutrients.fat100g} />
          <NutrientRow
            label="Saturated fat"
            kind="saturatedFat"
            gramsPer100g={product.nutrients.saturatedFat100g}
          />
          <NutrientRow label="Salt" kind="salt" gramsPer100g={product.nutrients.salt100g} />
        </div>

        <IngredientsPanel ingredientsText={product.ingredientsText} source={product.source} />
        <AllergensList allergens={product.allergens} source={product.source} />
      </div>

      <ScoreLegend />

      <button
        onClick={() => onShare(product)}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#256b29]"
      >
        Share this result
      </button>
    </div>
  );
}
