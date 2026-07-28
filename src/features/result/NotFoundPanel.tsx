interface NotFoundPanelProps {
  barcode: string;
  onScanAnother: () => void;
  onSearchInstead: () => void;
}

/**
 * Rendered when neither Open Food Facts nor its USDA FoodData Central
 * fallback has a record of a barcode (a permanent outcome, not a network
 * hiccup - see productLookup.ts and offTypes.ts LookupResult). States the
 * real coverage gap directly rather than glossing over it, and hands off to
 * OFF's own contribute flow instead of building a submission form here (see
 * docs/prd.md non-goals: no proprietary database-building) - USDA has no
 * equivalent public contribution flow for consumers.
 */
export function NotFoundPanel({ barcode, onScanAnother, onSearchInstead }: NotFoundPanelProps) {
  const contributeUrl = `https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${encodeURIComponent(barcode)}`;

  return (
    <div className="card p-6 text-center">
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl"
        style={{ backgroundColor: 'var(--color-surface-sunken)' }}
        aria-hidden
      >
        🔍
      </div>
      <p className="mb-1 font-mono text-sm text-ink-faint">{barcode}</p>
      <h2 className="mb-3 text-lg font-semibold text-ink">Not in our database yet</h2>
      <p className="mb-6 text-sm text-ink-muted">
        Checked against both Open Food Facts and USDA FoodData Central. This is common for
        smaller or regional Indian brands - neither database&apos;s India coverage is large
        compared to how many packaged products are actually on shelves here.
      </p>
      <div className="mb-4 flex flex-wrap justify-center gap-3">
        <button
          onClick={onScanAnother}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256b29]"
        >
          Scan a different product
        </button>
        <button
          onClick={onSearchInstead}
          className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken"
        >
          Search by name instead
        </button>
      </div>
      <a
        href={contributeUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-accent underline underline-offset-2"
      >
        Add this product to Open Food Facts
      </a>
    </div>
  );
}
