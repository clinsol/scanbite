# Scanbite — Phased Plan

## Phase 1 — V1 (this build)

**Goal:** prove the core scan -> honest result -> share loop works end to
end, at zero cost.

- **Milestones:** camera barcode scan (ZXing, checksum-validated) +
  manual digit entry + name search, all against the free Open Food Facts
  API; Nutri-Score/NOVA/ingredients/allergens/sugar-salt-fat rendered
  honestly with independent per-field "not reported" states; local
  recent-scans history (no account); canvas share-image + shareable
  `?barcode=` URL; honest not-found flow linking to Open Food Facts' own
  contribute form.
- **Deliverables:** working app at `localhost:3002` via `npm run dev`; 55
  passing unit/component tests; the 6 docs (this set).
- **Status:** complete. Typecheck / lint / test / build all clean; initial
  bundle ~210 kB with the ~438 kB ZXing chunk lazy-loaded separately
  (confirmed via `npm run build`).
- **Risks accepted for this phase** (see [prd.md](./prd.md) Non-goals,
  [architecture.md](./architecture.md)): no backend, no accounts, no
  premium tier, Open Food Facts' India coverage is thin (~10,000 products
  as of late 2024) so many regional/local brands will render the
  not-found state rather than a real result - this is the honest ceiling
  of the free data sources, not a code gap (the USDA fallback added later
  this phase doesn't change that ceiling - see "Also shipped" below).

## Deferred: everything explicitly out of V1 scope

Worth its own section since several of these were considered directly
and turned down for V1, not just unstarted:

1. **Accounts, sign-in, cross-device scan-history sync** - `localStorage`
   already serves the "recurring usage without setup" goal; an account
   system is a real cost (auth, a backend) not yet justified.
2. **Any premium/paid tier** - the business case (Yuka's freemium model)
   is real, but needs actual usage data first, not a guess at what to
   paywall on day one.
3. **A proprietary product database or in-app product-edit UI** - Open
   Food Facts' own contribute pipeline is used instead (see
   `NotFoundPanel.tsx`); building a competing submission flow would
   duplicate, not strengthen, the open-data ecosystem this app depends on.
4. **Native mobile app** - web-only, installable as a PWA at most; no
   App/Play Store distribution cost or review cycle for V1.
5. **Offline mode / service-worker caching** - adds real complexity
   (cache invalidation, stale-grade risk) for a tool whose whole premise
   is "reach a live, current data source."
6. **Server-rendered per-product Open Graph previews** - needs a backend
   (see `architecture.md`); the *shared image* carries the per-product
   payoff in V1, the shared *URL* just makes the destination re-openable.
7. **Two-product side-by-side comparison** - a real analog to Civic's
   compare mode, but a second independent state to design around; not
   asked for, deferred rather than scope-creeping into V1.
8. **Native `BarcodeDetector` API as the primary decode path** - Chromium
   -only; `@zxing/browser` covers every browser with one code path. Worth
   revisiting only as a perf optimization on supporting devices, gated
   behind real usage data showing decode speed is actually a problem.

## Also shipped: Playwright E2E suite

Added after Phase 1's manual dev-server verification (real barcode scans
against the live Open Food Facts API, screenshotted and confirmed) to lock
in automated regression coverage for the flows that live in state
hand-off between components, not in `lib/` pure functions - the same
reasoning as Civic's own `e2e/` suite.

- 12 specs across `barcode-entry-flow`, `search-flow`, `not-found-flow`,
  `share-flow`, and `console-errors` - network-mocked against Open Food
  Facts via `page.route()` (`e2e/fixtures.ts`), same boundary the unit
  tests mock, one layer further out.
- Two real bugs this pass caught that manual testing had missed: the
  "Scanbite" header was a bare `<button>`, not a real heading (fixed by
  wrapping it in an `<h1>` - a genuine accessibility gap, not just a test
  -selector convenience); and two ambiguous button-name matches ("Search"
  matching both the tab toggle and the submit button, "Share" matching
  both the trigger and the modal's own button) - fixed with `exact: true`
  in the specs themselves, since the underlying UI copy is fine as-is.
- Chromium only, same call Civic made: cross-browser and real-device
  testing (the camera, the native share sheet) stays manual QA (see
  `qa-strategy.md`), not automated, at this stage.

## Also shipped: USDA FoodData Central fallback

Added after a request to broaden coverage by "connecting more global
databases" and, separately, scraping the web for food data. Scraping was
evaluated and rejected outright (see `docs/architecture.md`/`docs/rules.md`
for the full reasoning: ToS risk across most sites that have food data, no
backend in this app to run a scraper on, and unverified scraped data breaks
the core "never show a number that isn't real" promise this project is
built around). USDA FoodData Central was added instead - a real, free,
legitimate, no-scraping second data source, wired in as a pure fallback:

- `lib/usda/` (client + parsing) and `lib/product/productLookup.ts`
  (fallback orchestration) - OFF stays primary, USDA is only queried on an
  OFF miss.
- Every result now carries and displays its real `source` (`openfoodfacts`
  | `usda`) - in `ProductResult.tsx`, in the badges' "not rated" copy, and
  baked into the share card's attribution text - because USDA doesn't
  compute Nutri-Score/NOVA and a result shouldn't imply OFF was the one
  that declined to rate it when OFF never had the product at all.
- **Known limitation, stated directly**: USDA's branded-food data skews
  heavily US-market. This does not meaningfully close the India-specific
  coverage gap that was the original motivation - that gap is upstream, in
  OFF's own crowdsourced coverage, and isn't something either client-side
  code or a second API can route around (see `prd.md`).
- CSP (`index.html`) and unit tests (`usdaClient.test.ts`,
  `productLookup.test.ts`) updated accordingly; E2E fixtures mock USDA's
  endpoint to stay deterministic (see `qa-strategy.md`).

## Phase 2 — Deployed, shareable V1 (not started)

**Goal:** a real person other than the builder can open a URL and use it.

- **Milestones:** connect a free static host (Vercel/Netlify/Cloudflare
  Pages) for auto-deploy on push.
- **Risks / mitigations:** Open Food Facts' free-tier usage policy could
  in principle rate-limit heavy real traffic - monitor for that in
  production before building anything defensive; don't add a caching
  proxy speculatively (YAGNI, same posture as Civic's Phase 3).

## Phase 3 — Depth, once usage data exists

**Goal:** deepen the product only once real usage shows what's actually
worth building next - not speculatively.

- **Candidate milestones** (not committed): resolve the premium-tier
  decision with real conversion/retention data in hand; investigate
  whether India-specific packaged-food data exists anywhere else worth
  cross-referencing against Open Food Facts' own coverage; two-product
  comparison, if users actually ask for it.
