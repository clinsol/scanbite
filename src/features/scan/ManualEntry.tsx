import { useState } from 'react';
import { isValidBarcode } from '../../lib/barcode/barcodeValidate';
import { searchProducts } from '../../lib/product/productLookup';
import type { ProductSearchResult } from '../../lib/openfoodfacts/offTypes';

interface ManualEntryProps {
  onSelectBarcode: (barcode: string) => void;
  initialMode?: 'barcode' | 'search';
}

/**
 * The two manual fallback paths required by the plan: type the barcode
 * digits directly (checksum-validated the same way a camera decode is), or
 * search by product name - used both when the camera isn't available and
 * when the user wants to try a different lookup after a not-found result.
 */
export function ManualEntry({ onSelectBarcode, initialMode = 'barcode' }: ManualEntryProps) {
  const [mode, setMode] = useState<'barcode' | 'search'>(initialMode);

  return (
    <div className="space-y-4">
      <div className="inline-flex gap-1 rounded-lg bg-surface-sunken p-1">
        <button
          onClick={() => setMode('barcode')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mode === 'barcode' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
        >
          Enter barcode
        </button>
        <button
          onClick={() => setMode('search')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mode === 'search' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
        >
          Search by name
        </button>
      </div>

      {mode === 'barcode' ? (
        <BarcodeDigitForm onSelectBarcode={onSelectBarcode} />
      ) : (
        <NameSearchForm onSelectBarcode={onSelectBarcode} />
      )}
    </div>
  );
}

function BarcodeDigitForm({ onSelectBarcode }: { onSelectBarcode: (barcode: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidBarcode(value.trim())) {
      setError('That doesn\'t look like a valid barcode - check the digits and try again.');
      return;
    }
    setError(null);
    onSelectBarcode(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 8901058851226"
        className="w-full rounded-lg border border-hairline px-3 py-2 text-sm transition-colors focus:border-accent"
      />
      {error && <p className="text-sm text-poor">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256b29]"
      >
        Look up
      </button>
    </form>
  );
}

function NameSearchForm({ onSelectBarcode }: { onSelectBarcode: (barcode: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSearching(true);
    const found = await searchProducts(query);
    setResults(found);
    setSearched(true);
    setIsSearching(false);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Maggi noodles"
          className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256b29] disabled:opacity-60"
        >
          Search
        </button>
      </form>

      {isSearching && <p className="text-sm text-ink-faint">Searching...</p>}

      {!isSearching && searched && results.length === 0 && (
        <p className="text-sm text-ink-faint">No matches in Open Food Facts or USDA FoodData Central.</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.code}>
              <button
                onClick={() => onSelectBarcode(r.code)}
                className="flex w-full items-center gap-3 rounded-lg border border-hairline p-2 text-left transition-colors hover:border-accent hover:bg-surface-sunken"
              >
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-sunken text-[10px] text-ink-faint"
                    aria-hidden
                  >
                    No image
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.name ?? 'Unnamed product'}</p>
                  {r.brands && <p className="truncate text-xs text-ink-faint">{r.brands}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
