# Scanbite — Architecture

## System overview

Scanbite is a fully client-side single-page app, the same constraint as
its sister project Civic - no backend, no database, no server-side code.
Every request goes to a static file host (the app bundle) or directly to
one of two free, public product-data APIs from the browser. Zero cost to
run.

## Two-source lookup

Open Food Facts (OFF) is the primary source - it's the one with real
Nutri-Score/NOVA grades. USDA FoodData Central is a pure additive fallback,
queried only when OFF returns no record, added because OFF's India-
specific coverage is thin and a second free, legitimate, no-scraping open
database was worth wiring in (see [prd.md](./prd.md) and
[rules.md](./rules.md)). **Web scraping was considered and rejected**: most
sites with food data prohibit it in their ToS, this app has no backend to
run a scraper on, and unverified scraped data would break the core "never
show a number that isn't real" promise - USDA's API has none of those
problems.

`lib/product/productLookup.ts` owns the fallback order:

1. Try OFF (`lib/openfoodfacts/offClient.ts`). A `found` result returns
   immediately - USDA is never even called.
2. On OFF `not_found` or `error`, try USDA
   (`lib/usda/usdaClient.ts`). A USDA match returns `found`, tagged
   `source: 'usda'`.
3. OFF's `not_found` is authoritative and permanent - if USDA's own request
   then fails (network/parse), that doesn't get reinterpreted as `error`;
   USDA had nothing to add either way, so the result stays `not_found`. But
   if OFF itself couldn't be reached (`error`, a transient failure, not a
   verdict) and USDA also comes up empty, `error` is preserved rather than
   silently downgraded to `not_found` - a transient failure is not the same
   claim as "this doesn't exist."

USDA has real, verified structural differences from OFF, each handled
honestly rather than papered over (verified against USDA's live API before
writing the parser - see `lib/usda/usdaTypes.ts`):

- **No dedicated barcode-lookup endpoint.** A GTIN/UPC is matched by
  searching its zero-padded 14-digit GTIN-14 form as free text, then
  checking each result's own `gtinUpc` field for an exact match - a fuzzy
  text match isn't good enough to treat as "this is the scanned product."
- **No Nutri-Score, no NOVA group, no structured allergens, no product
  image** in USDA's branded-food records - each renders through the exact
  same per-field "not reported" UI states real OFF gaps already use, with
  copy naming USDA specifically as the reason (see `NutriScoreBadge.tsx`/
  `NovaBadge.tsx`), not a generic "OFF hasn't rated it" message that would
  misattribute the source.
- **Sodium in mg, not a salt figure** - converted via the standard salt =
  sodium x 2.5 factor, same as OFF's own `salt_100g` convention, only when
  a real sodium value exists.
- **Every result names its actual source** (`Product['source']`) - shown
  in the UI (`ProductResult.tsx`'s "Data from ..." line) and baked into the
  share card's attribution text (`buildShareImage.ts`), because the two
  sources have genuinely different capabilities and a shared/screenshotted
  result should say which one it came from.

## Tech choices and why

- **React 19 + TypeScript + Vite + Tailwind v4 + Vitest** - identical stack
  to Civic, no new tooling to learn, same testing discipline (pure `lib/`
  functions, fixtures for third-party response shapes).
- **`@zxing/browser` + `@zxing/library`** for camera barcode decoding -
  MIT-licensed, decodes EAN-13/UPC-A/UPC-E/EAN-8 in JS/WASM, works
  identically across Chrome/Safari/Firefox/Android/iOS. The native
  `BarcodeDetector` (Shape Detection) API was deliberately not used as the
  primary path because it's Chromium-only - one decode engine covering
  every browser beat maintaining two code paths to avoid one dependency.
  Deferred as a possible Phase 2 perf optimization on supporting devices,
  gated behind real usage data (see [phases.md](./phases.md)).
- **No router** - two states (scan-first home, and a specific product
  result) are handled via a `?barcode=` URL query param read/written
  directly in `App.tsx`, the same solution Civic's own Phase 2 plan
  already commits to for itself. A router would be an unrequested
  abstraction for two states.
- **`localStorage` for recent-scans history** - the one piece of state
  Scanbite persists (Civic persists nothing - see its rules.md). Exists
  specifically to serve recurring usage without an account system.
  `src/lib/history/scanHistory.ts` is a pure, framework-free module, kept
  unit-testable the same way every other `lib/` module is.
- **Canvas 2D API for the share image** - no charting/image library; a few
  hundred lines of `drawShareCard` draw a 1080x1080 result card directly.

## Deployment considerations

- **Static hosting only** - `npm run build`'s `dist/` output deploys to any
  free static host (Vercel/Netlify/Cloudflare Pages), same as Civic.
- **One optional secret** - `VITE_USDA_API_KEY`, the same client-bundle-
  visible posture as Civic's `VITE_WAQI_TOKEN` (see `rules.md`). Falls back
  to USDA's public `DEMO_KEY` when unset, so the app works with zero setup;
  a real key just raises the USDA fallback's rate limit above 30/hour.
- **Content-Security-Policy** via a `<meta>` tag in `index.html`, scoped to
  the three real external origins: `world.openfoodfacts.org` (API),
  `images.openfoodfacts.org` (product images), and `api.nal.usda.gov` (the
  USDA fallback). No map tile server, no Google Fonts - system font stack,
  fewer external origins than that would need.
- **Code-split at the `App.tsx` level**: `ScannerView` (and therefore the
  `@zxing/browser`/`@zxing/library` chunk) is `React.lazy()`-loaded, the
  same reasoning as Civic's lazy-loaded Leaflet map - confirmed via
  `npm run build`: the initial bundle is ~210 kB, with the ~438 kB ZXing
  chunk only loading once scanning actually starts. Someone opening a
  shared `?barcode=` result link never pays for scanner code they won't
  use in that session.
- **HTTPS requirement for the camera**: `getUserMedia` needs a secure
  context. Production static hosts are HTTPS by default, so this is a
  non-issue in production; testing the camera from a real phone against a
  local dev server needs an HTTPS tunnel (e.g. `ngrok` or Vite's `--https`)
  - a real dev-time gotcha, documented once here rather than rediscovered.

## Data flow

```
Camera path:
User opens the scan-first home shell
  -> ScannerView starts the camera (lib/barcode/barcodeScanner.ts)
  -> ZXing decodes a video frame -> raw barcode string
  -> lib/barcode/barcodeValidate.ts checksum-validates it locally
     (rejects camera misreads for free, before any network call)
  -> valid barcode -> App.tsx sets it as the `?barcode=` URL param

Manual path:
User types a barcode (checksum-validated the same way) or searches by name
  -> lib/product/productLookup.ts searchProducts() (OFF first, USDA only
     if OFF has zero matches - see "Two-source lookup" above)
  -> user picks a result -> same barcode-selected path as above

Both paths converge:
  -> App.tsx's effect calls lib/product/productLookup.ts
     lookupProduct(barcode)
  -> Open Food Facts API (free, no auth), then USDA FoodData Central as a
     fallback (free, DEMO_KEY or VITE_USDA_API_KEY)
  -> resolves to a discriminated union: { type: 'found' | 'not_found' |
     'error' } ('not_found' = neither source has a record, permanent;
     'error' = network/shape-drift failure, transient - these render as
     visibly different UI, never collapsed into one "no data" state)
  -> features/result/ProductResult.tsx renders one of its 4 states
     (loading / not_found / error / found), each sub-field
     (NutriScoreBadge, NovaBadge, each NutrientRow, IngredientsPanel,
     AllergensList) independently rendering its own "not reported" state
     rather than assuming the rest of the product is complete
  -> lib/history/scanHistory.ts records the scan (including a not-found
     miss) to localStorage
  -> a "found" result's "Share" button -> lib/share/buildShareImage.ts
     draws a canvas card -> features/share/ShareCard.tsx wires the Web
     Share API (native share sheet) with a download/copy-link fallback
```

A monotonic request-id guard in `App.tsx` (the same pattern as Civic's
`LocalityColumn`) means only the most recently started barcode lookup is
ever allowed to commit its result, so a fast re-scan immediately after a
slow one can't have the slow one's stale result overwrite the correct one.

## Component / module map

```
src/
  lib/                          pure logic + API wrappers, unit-tested, zero React
    openfoodfacts/offClient.ts    fetchProductByBarcode(), searchProductsByName()
    openfoodfacts/offTypes.ts     parsing + runtime shape validation + the LookupResult union
    usda/usdaClient.ts            fetchProductByBarcodeFromUsda(), searchProductsByNameFromUsda()
    usda/usdaTypes.ts             USDA response parsing + mapping into the shared Product shape
    product/productLookup.ts      lookupProduct()/searchProducts() - OFF -> USDA fallback order
    barcode/barcodeScanner.ts     ZXing camera wrapper (start/stop, format-restricted)
    barcode/barcodeValidate.ts    EAN-13/UPC-A/EAN-8 checksum validation, pure, no I/O
    health/nutrientBands.ts       UK FSA traffic-light thresholds - the "not a black box" file
    health/labelPresentation.ts   OFF's own grade/NOVA group -> color+copy, never recomputed
    history/scanHistory.ts        localStorage-backed recent-scans list
    share/buildShareImage.ts      pure content derivation + canvas drawing for the share card
  features/                     React components with state, one concern each
    scan/ScannerView.tsx           camera view + live decode (lazy-loaded, see above)
    scan/ManualEntry.tsx           barcode digit entry + name-search fallback
    result/ProductResult.tsx       owns all 4 lookup states
    result/NutriScoreBadge.tsx, NovaBadge.tsx, NutrientRow.tsx, IngredientsPanel.tsx,
      AllergensList.tsx, NotFoundPanel.tsx
    history/RecentScans.tsx        local scan history list
    share/ShareCard.tsx            canvas render + Web Share API + fallbacks
  components/                   small, shared, presentation-only
    Badge.tsx, ScoreLegend.tsx (always-visible, never a tooltip), AttributionFooter.tsx
    (required ODbL attribution), CameraPermissionNotice.tsx
  App.tsx                       two shells, `?barcode=` query-param routing
```

Dependency direction is one-way: `components` <- `features` <- `App`, and
`lib` has no dependency on React at all - the same rule as Civic, and for
the same reason: every `lib/` function is testable without rendering
anything.

## External dependencies (all free tier, called directly from the browser)

| Service                                | Purpose                                  | Auth | Rate limit posture               |
| --------------------------------------- | ----------------------------------------- | ---- | ---------------------------------- |
| Open Food Facts API (primary)           | product lookup by barcode + name search   | none | free, no rate limit for reasonable use |
| Open Food Facts image CDN               | product images                            | none | same posture as the API            |
| USDA FoodData Central API (fallback)    | product lookup by barcode + name search, tried only on an OFF miss | `VITE_USDA_API_KEY`, falls back to public `DEMO_KEY` | free; `DEMO_KEY` capped at 30/hr, 50/day per IP - a real key removes that cap |

None of these sit behind a backend proxy in V1 - see
[phases.md](./phases.md) for when that might change, gated behind actual
usage, not projected.
