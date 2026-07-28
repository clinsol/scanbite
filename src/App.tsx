import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { lookupProduct } from './lib/product/productLookup';
import type { LookupResult, Product } from './lib/openfoodfacts/offTypes';
import { addScan } from './lib/history/scanHistory';
import { ManualEntry } from './features/scan/ManualEntry';
import { ProductResult } from './features/result/ProductResult';
import { RecentScans } from './features/history/RecentScans';
import { ShareCard } from './features/share/ShareCard';
import { AttributionFooter } from './components/AttributionFooter';

// ScannerView pulls in @zxing/browser + @zxing/library (the bulk of the
// bundle) - lazy-loaded so someone opening a shared `?barcode=` result link
// never pays for scanner code they won't use in that session, the same
// reasoning behind Civic's own React.lazy()-loaded Leaflet map chunk.
const ScannerView = lazy(() =>
  import('./features/scan/ScannerView').then((m) => ({ default: m.ScannerView }))
);

/**
 * Two shells keyed off a `?barcode=` query param, not a router library -
 * the same solution Civic's own Phase 2 plan already commits to for
 * itself. Presence of `barcode` selects the result shell (shareable,
 * bookmarkable); absence selects the scan-first home shell.
 */
export default function App() {
  const [barcode, setBarcode] = useState<string | null>(() => readBarcodeFromUrl());
  const [result, setResult] = useState<LookupResult | null>(null);
  const [manualEntryMode, setManualEntryMode] = useState<'barcode' | 'search' | null>(null);
  const [sharingProduct, setSharingProduct] = useState<Product | null>(null);
  const latestRequestId = useRef(0);

  // Derived, not stored - avoids a separate isLoading flag that would need
  // its own synchronous setState in the effect below. True exactly when
  // there's a barcode to look up and no result for it yet.
  const isLoading = barcode !== null && result === null;

  function runFetch(code: string) {
    const requestId = ++latestRequestId.current;
    lookupProduct(code).then((lookup) => {
      if (requestId !== latestRequestId.current) return;
      setResult(lookup);
      recordScan(code, lookup);
    });
  }

  useEffect(() => {
    // Only reacts to `barcode` changing - the actual fetch call happens
    // inside runFetch's .then() callback, never synchronously here, so
    // there's no direct setState in the effect body itself.
    if (barcode !== null) runFetch(barcode);
  }, [barcode]);

  function selectBarcode(next: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('barcode', next);
    window.history.pushState({}, '', url);
    setManualEntryMode(null);
    setResult(null);
    setBarcode(next);
  }

  function retry() {
    if (barcode === null) return;
    setResult(null);
    runFetch(barcode);
  }

  function goHome() {
    const url = new URL(window.location.href);
    url.searchParams.delete('barcode');
    window.history.pushState({}, '', url);
    setBarcode(null);
    setResult(null);
    setManualEntryMode(null);
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <header className="border-b border-hairline px-4 py-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          <button
            onClick={goHome}
            className="inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M7 4v6a2 2 0 0 0 2 2v8M9 4v6M11 4v6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 4c-2 2-2 5 0 7v9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Scanbite
          </button>
        </h1>
        <p className="mt-1 text-sm text-ink-faint">Know what&apos;s really in it.</p>
      </header>

      <main className="px-4 pb-8 pt-6">
        {barcode === null ? (
          <div>
            {manualEntryMode ? (
              <ManualEntry onSelectBarcode={selectBarcode} initialMode={manualEntryMode} />
            ) : (
              <Suspense fallback={<div className="skeleton-shimmer aspect-square rounded-lg" />}>
                <ScannerView
                  onDetect={selectBarcode}
                  onEnterManually={() => setManualEntryMode('barcode')}
                />
              </Suspense>
            )}
            <RecentScans onSelect={selectBarcode} />
          </div>
        ) : (
          <ProductResult
            isLoading={isLoading}
            result={result}
            barcode={barcode}
            onRetry={retry}
            onScanAnother={goHome}
            onSearchInstead={() => {
              setBarcode(null);
              setManualEntryMode('search');
            }}
            onShare={setSharingProduct}
          />
        )}
      </main>

      <AttributionFooter />

      {sharingProduct && (
        <ShareCard
          product={sharingProduct}
          shareUrl={buildShareUrl(sharingProduct.code)}
          onClose={() => setSharingProduct(null)}
        />
      )}
    </div>
  );
}

function readBarcodeFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('barcode');
}

function buildShareUrl(barcode: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('barcode', barcode);
  return url.toString();
}

function recordScan(barcode: string, lookup: LookupResult): void {
  if (lookup.type === 'error') return; // a transient failure isn't worth recording as a scan.

  addScan({
    barcode,
    productName: lookup.type === 'found' ? lookup.product.name : null,
    nutriscoreGrade: lookup.type === 'found' ? lookup.product.nutriscoreGrade : null,
    notFound: lookup.type === 'not_found',
    scannedAt: new Date().toISOString(),
  });
}
