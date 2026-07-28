# Scanbite — Rules

## Coding standards

- TypeScript strict-by-convention: `@typescript-eslint/no-explicit-any` is
  an error, not a warning (see `eslint.config.js`) - every third-party
  response is parsed through a typed, runtime-validated function in
  `offTypes.ts`, never cast with `any`.
- `lib/` has zero React dependency and zero side effects beyond the one
  `fetch`/`localStorage` call each wrapper exists to make - every other
  function in `lib/` is pure and unit-tested.
- No new dependency for something a few lines of code can do (see
  `architecture.md`'s reasoning for Canvas 2D over an image-compositing
  library, and for one ZXing decode path over branching on
  `BarcodeDetector`).

## Data integrity (the one non-negotiable rule, inherited from Civic)

**Never show a score or number that isn't real.** Open Food Facts'
`nutriscore_grade` and `nova_group` are rendered verbatim - Scanbite never
computes a competing score. Where a source has no data for a field, the UI
shows an explicit "not reported"/"not rated" state, never a default value,
a guess, or silence that could read as zero. See `docs/architecture.md`
and `docs/design.md` "Per-field honesty."

**Adding a second data source (USDA) extends this rule, it doesn't bend
it**: every `Product` carries its real `source`, shown in the UI and in
the share card, because OFF and USDA have genuinely different
capabilities (only OFF computes Nutri-Score/NOVA) - a "not rated" message
that didn't say which source that's about would itself be a small
dishonesty. **Scraping arbitrary websites for more coverage was considered
and rejected** (see `docs/architecture.md`/`docs/prd.md`): most sites
prohibit it in their ToS, this app has no backend to run a scraper on, and
unverified scraped data has no schema guarantee the way OFF's community
-reviewed data or USDA's government data does - it would break this exact
rule.

## React hooks discipline

This project's `eslint-plugin-react-hooks` flags synchronous `setState`
calls in effect bodies (`react-hooks/set-state-in-effect`) - a stricter
rule than Civic needed to contend with when it was built. The fix pattern
used throughout: compute a value once via a lazy `useState(() => ...)`
initializer instead of an effect + `setState` on mount (see
`RecentScans.tsx`, `ScannerView.tsx`'s camera-availability check), or
derive state instead of storing it (see `App.tsx`'s `isLoading`, computed
from `barcode`/`result` rather than its own flag). Every `setState` that
must run after an async operation happens inside that operation's
callback (`.then()`), never synchronously at the top of the effect body.

## Testing strategy

- Unit tests for every `lib/` module, with real, checksum-verified
  fixture barcodes for `barcodeValidate.test.ts` (not made-up digit
  strings) and captured-shape fixtures for `offClient.test.ts`/
  `usdaClient.test.ts` (a real "found" response - USDA's captured live
  against a real barcode, see `usdaTypes.ts` - a not-found/empty response,
  and a deliberately malformed one asserting graceful degradation).
- `productLookup.test.ts` covers the OFF -> USDA fallback order itself as
  its own unit, independent of either client: OFF-found short-circuits
  USDA, OFF-not_found falls through to USDA, OFF-error still tries USDA but
  preserves `error` (not `not_found`) if USDA also comes up empty.
- `ProductResult.test.tsx` covers all 4 states, mirroring Civic's
  `HeroCard.test.tsx`.
- Playwright E2E (`e2e/`) mocks Open Food Facts at the network layer, the
  same reasoning as Civic's `e2e/`: determinism, no dependency on OFF's
  real data changing under the test. USDA's endpoint is mocked to return
  empty results in these fixtures so OFF's own found/not-found/search specs
  stay deterministic rather than depending on USDA's live, rate-limited
  `DEMO_KEY`; the fallback logic itself is unit-tested, not duplicated at
  the E2E layer.

## Dev-time gotchas worth writing down once

- **Camera testing needs HTTPS.** `getUserMedia` requires a secure
  context - testing the scanner from a real phone against a LAN dev
  server needs an HTTPS tunnel (`ngrok`, or Vite's `--https` flag).
  Non-issue in production (static hosts are HTTPS by default).
- **`react-hooks/set-state-in-effect`** - see above; don't reflexively
  suppress it with an eslint-disable, restructure per the patterns already
  in this codebase first.

## Release process

`npm run typecheck && npm run lint && npm test && npm run build` before
considering any change done - identical gate to Civic. `npm audit` as part
of that gate once dependencies have had time to accrue advisories.

## Security notes

- Open Food Facts requires no API key at all. `VITE_USDA_API_KEY` is
  optional (falls back to USDA's public `DEMO_KEY`) and, like Civic's
  `VITE_WAQI_TOKEN`, is client-bundle-visible by design at this stage - a
  free, low-privilege key with a generous rate limit, not a secret whose
  exposure is a real security issue.
- `localStorage` holds only a local scan history (barcode, product name,
  grade, timestamp) - no PII, nothing account-linked, nothing that
  survives a browser data clear as a loss worth worrying about.
