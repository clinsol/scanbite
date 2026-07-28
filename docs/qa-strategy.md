# Scanbite — QA Strategy

## Why this doc's shape is unusual

Like Civic, Scanbite has no backend, no accounts, no writes - its entire
risk surface is: **two free third-party APIs it doesn't control** (Open
Food Facts, primary; USDA FoodData Central, fallback), **the camera/decode
pipeline** (a genuinely new risk class Civic never had), and **honest
handling of data sources with real, known coverage gaps**. Test strategy
weights accordingly.

## Test pillars

### 1. Automation QA

| Scenario                                                                 | Why it matters                                                                 |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `barcodeValidate` against real, checksum-verified EAN-13/UPC-A/EAN-8    | A camera misread that isn't caught locally produces a false "not found" - the whole not-found flow's honesty depends on this catching garbage first. |
| `offClient` against a real "found" shape, a real `status: 0`, and a deliberately malformed shape | Distinguishes permanent (not_found) from transient (error) - conflating them is a small dishonesty; a schema-drift shape must degrade, not crash or render `undefined`. |
| `usdaClient` against a real captured USDA branded-food shape (verified live before writing the parser), a gtinUpc-mismatch case, and failure cases | USDA has no dedicated barcode endpoint - an inexact match would silently attach the wrong product's data to a scanned barcode, worse than a false not-found. |
| `productLookup`'s OFF -> USDA fallback order, isolated from either real client | The order (OFF found short-circuits; not_found/error both try USDA; error is preserved over not_found on a double miss) is the one piece of this feature most likely to regress silently if reworked later. |
| `nutrientBands` boundary values at each FSA threshold                    | The one file a reviewer checks to verify "is this threshold real" - a boundary bug here silently mis-colors a real product. |
| `ProductResult`'s 4 states                                                | The most visible possible regression - an unhandled state rendering nothing. |
| `buildShareCardContent` never fabricating a headline stat                | The share card is the most-seen artifact (screenshots outlive the app session) - it must never state a number OFF didn't report. |

### 2. Manual / exploratory QA

These stay manual - they need a real device, a real camera, or judgment:

- **Real barcode scans on a real device**, both directions of the
  coverage gap: a globally-distributed product (confirms the happy path
  end to end) and a pre-verified-missing regional Indian brand (confirms
  the not-found flow without guessing what's missing at demo time).
- **Camera-denied path** - deny permission, confirm `CameraPermissionNotice`
  + manual entry appear automatically, no dead end.
- **Share flow on real Android Chrome and real iOS Safari** - confirms
  the native share sheet actually opens with the image attached, not just
  that `canvas.toBlob()` didn't throw. Desktop fallback (download + copy
  link) checked separately.
- **HTTPS/dev-camera gotcha** - confirm the camera actually works from a
  real phone against a tunneled dev server, not just `localhost` on
  desktop (see `rules.md`).
- **Script/input variety in the name-search box** - non-Latin scripts,
  emoji, SQL-injection-shaped strings - should just no-op as an Open Food
  Facts search query with nothing rendered unescaped.

### 3. Performance QA

- **Bundle size** - `@zxing/browser`/`@zxing/library` is the majority of
  the app's JS; confirmed lazy-loaded via `npm run build`'s chunk split
  (see `architecture.md`) so a shared-link visitor who never scans doesn't
  pay for it.
- **Decode loop CPU/battery** - ZXing decodes continuously while the
  camera is open; `stopScanning()` must actually release the camera
  stream on unmount/navigate-away, or the camera light and battery drain
  continue after the user has left the scan screen - a real, testable
  failure mode, not hypothetical.

### 4. Security QA

- **No API key anywhere** - Open Food Facts needs none, so there's no
  `VITE_*`-exposed secret to manage the way Civic has for WAQI.
- **Untrusted third-party content rendered as data** - product names,
  brands, and ingredient text are community-contributed on Open Food
  Facts and rendered directly; React escapes this by default (no
  `dangerouslySetInnerHTML` anywhere in the render path) - worth an
  explicit test fixture with a `<script>`-shaped product name confirming
  that holds, as a Phase 2 follow-up.
- **CSP** scoped to the two real external origins (`world.openfoodfacts.org`,
  `images.openfoodfacts.org`) - see `architecture.md`.

## Edge cases to specifically watch for

1. **Camera misreads on 1D barcodes** - common enough that local checksum
   validation (not just trusting ZXing's raw decode) is load-bearing, not
   defensive-for-show. **Handled** - see `barcodeValidate.ts`.
2. **Re-scanning the same barcode rapidly** - a monotonic request-id guard
   in `App.tsx` ensures a slower, earlier lookup can't overwrite a faster,
   later one's result. **Handled**, same pattern as Civic's
   `LocalityColumn`.
3. **A "found" product missing individual fields** - every badge/row
   independently renders its own "not reported" state. **Handled** - see
   `design.md` "Per-field honesty."
4. **Sharing a product with no sugar figure** - `buildShareCardContent`
   returns `headlineStat: null` rather than a fabricated number.
   **Handled**, covered by a unit test.
5. **`localStorage` unavailable or full** (private browsing, quota) -
   `scanHistory.ts` catches and silently no-ops rather than breaking the
   actual scan flow over a nice-to-have. **Handled.**
6. **USDA's fallback request itself fails after OFF already returned a
   confirmed not_found** - must stay `not_found`, not flip to `error`; OFF's
   verdict is authoritative, USDA is purely additive. **Handled** - see
   `productLookup.test.ts`.
7. **A USDA-sourced result's missing Nutri-Score/NOVA must not read as
   "Open Food Facts hasn't rated this yet"** - that phrasing would
   misattribute the source for a product OFF never had at all. **Handled**
   - `source`-aware copy in `NutriScoreBadge.tsx`/`NovaBadge.tsx`.

## Applied this pass: USDA FoodData Central fallback

Added as a second, legitimate data source after a request to broaden
coverage (scraping was considered and rejected - see `architecture.md`).

- `usdaClient.test.ts`: a real captured USDA branded-food response
  (General Mills Cheerios, verified live against the real API before
  writing the parser, the same discipline as OFF's captured fixtures),
  a gtinUpc-mismatch case (confirms no fuzzy-match false positive), and
  the standard failure-mode set (non-2xx, network throw, blank query).
- `productLookup.test.ts`: the fallback order itself, isolated from either
  real client via `vi.spyOn` - OFF-found short-circuits USDA entirely;
  OFF-not_found and OFF-error both try USDA; a double miss after an
  OFF-error preserves `error` rather than downgrading to `not_found`.
- E2E fixtures (`e2e/fixtures.ts`) now also mock USDA's endpoint (always
  empty) so the existing OFF-focused specs stay deterministic and don't
  depend on USDA's live, rate-limited `DEMO_KEY` responding a particular
  way during CI.
- CSP (`index.html`) updated to allow `api.nal.usda.gov` - the fallback
  would otherwise be silently blocked in production despite working in
  local dev (no CSP enforcement gap was actually hit, but this was checked
  deliberately rather than discovered later).

## Applied this pass: Playwright E2E suite

12 specs added (see `phases.md` "Also shipped"), network-mocked against
Open Food Facts. Two real, previously-latent issues this pass found and
fixed directly rather than just logged:

- The "Scanbite" header was a bare `<button>`, not a real heading - a
  genuine accessibility gap (a page should expose exactly one `<h1>`
  identifying it), not just a test-selector inconvenience. Fixed by
  wrapping the button in an `<h1>`.
- Two button-name collisions ("Search" matched both the name-search tab
  toggle and its own submit button; "Share" matched both the trigger and
  the share-card modal's own button) - resolved in the specs with
  `exact: true`, since the UI copy itself ("Search by name" vs. "Search",
  "Share this result" vs. "Share") is fine and doesn't need changing.

## Left as manual / not actioned

- Cross-browser camera testing beyond Chrome/Safari on real devices -
  needs real hardware, not something to fake in CI.
- The Web Share API's actual native share sheet - not invokable in
  headless Chromium; the E2E suite asserts the documented fallback path
  (direct download when `navigator.share` is unavailable) instead, per
  `architecture.md`.
