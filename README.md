# Scanbite

> Scan a packaged food's barcode, see a transparent health breakdown - no
> account, no guessed numbers, just real data rendered honestly.

Scan a barcode (or search by name) and see Nutri-Score, NOVA processing
group, ingredients, allergens, and per-100g sugar/salt/fat - sourced from
[Open Food Facts](https://world.openfoodfacts.org) (a free, open,
community-contributed product database), with
[USDA FoodData Central](https://fdc.nal.usda.gov) as a fallback when OFF
has no record of a barcode. Share a result as an image with one tap.

## Why this exists

Front-of-pack marketing claims aren't a comparison. Apps that solve this
already exist abroad ([Yuka](https://yuka.io) has 60M+ users in Europe),
but India-specific packaged-food coverage in the open data those apps rely
on is still thin - real whitespace, not a solved problem, in this market
specifically.

Scanbite's bet: **never show a score that didn't come from a real,
verified data source.** No competing scoring methodology invented here -
see `src/lib/health/` for the one thing this app does compute (unit
conversions and FSA traffic-light banding of the source's own raw numbers,
both cited and inspectable, never a black box). Nutri-Score and NOVA are
Open Food Facts' own methodologies - USDA doesn't compute either, so a
USDA-sourced result honestly says so rather than guessing a grade.

## Getting started

Requires Node 18+.

```bash
npm install
npm run dev          # http://localhost:3002
```

No API key required to start - Open Food Facts needs none, and the USDA
fallback works out of the box against its public `DEMO_KEY` (rate-limited:
30 requests/hour, 50/day per IP). For real use, get a free key at
[api.data.gov/signup](https://api.data.gov/signup/) and set it in
`.env.local`:

```bash
cp .env.example .env.local
# then edit .env.local:
VITE_USDA_API_KEY=your-key-here
```

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run test:coverage
```

## Data sources

- **[Open Food Facts](https://world.openfoodfacts.org)** (primary) - free,
  no-auth, ODbL-licensed, ~4M products across 150 countries. Its own
  [India-specific coverage](https://in.openfoodfacts.org) is still small
  (~10,000 products as of late 2024) against a market with hundreds of
  thousands of packaged SKUs.
- **[USDA FoodData Central](https://fdc.nal.usda.gov)** (fallback, tried
  only when OFF has no record) - free, public-domain US government branded-
  food data. Skews heavily toward the US market, so it doesn't meaningfully
  close the India coverage gap above - see `docs/architecture.md`.

When neither source has a barcode, Scanbite says so honestly rather than
papering over the gap with a guess (see `docs/qa-strategy.md`).

## Project structure

```
src/
  lib/
    openfoodfacts/   OFF API client + response parsing/validation
    usda/            USDA FoodData Central fallback client + parsing
    product/         OFF -> USDA lookup/search orchestration
    barcode/         camera decode wrapper (ZXing) + checksum validation
    health/          FSA nutrient banding + OFF grade/NOVA presentation
    history/         localStorage-backed recent-scans list
    share/           share-card content + canvas drawing
  features/
    scan/            camera scanner + manual barcode/search entry
    result/           the 4-state product result view
    history/          recent scans list
    share/            share-card modal
  components/        Badge, ScoreLegend, AttributionFooter, CameraPermissionNotice
```

Every `lib/` module has its own tests with mocked network/localStorage -
none make real network calls during `npm test`.

## Known limits (deliberate, not oversights)

- **Open Food Facts' India coverage is thin, and USDA doesn't fill that
  specific gap.** Not a code gap - see "Data sources" above.
- **No accounts, no premium tier, no proprietary product database.** All
  deliberately deferred - see `docs/phases.md`.
- **Web-only, not a native app.** Installable as a PWA at most for now.
- **Shared links show one generic preview image**, not a per-product one -
  a static host can't server-render per-product Open Graph tags. The
  *shared image* (downloaded/sent directly) carries the per-product
  payoff; the *URL* just makes the destination re-openable.
