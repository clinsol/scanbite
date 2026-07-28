# Scanbite — Product Requirements Document

## Vision

Scanbite lets anyone scan a packaged food's barcode and see a transparent,
source-cited health breakdown - Nutri-Score, processing level, and the raw
sugar/salt/fat numbers - instead of trusting front-of-pack marketing or
guessing.

## Problem

A shopper standing in an aisle deciding between two packets of biscuits has
no fast way to know which one is actually worse for them - front-of-pack
claims ("no added sugar," "baked not fried") are marketing, not a
comparison. Apps that solve this exist abroad (Yuka has 60M+ users in
Europe) but India-specific packaged-food coverage in the open data those
apps rely on is still thin, and no dominant local player has filled the
gap yet.

Public data that could answer "is this actually healthy" already exists
(Open Food Facts' community-contributed ingredient/nutrient database, with
its own published Nutri-Score and NOVA methodologies) but isn't presented
in a form a shopper can use in the 10 seconds they have standing in a shop
aisle.

**A "connect more databases, scrape the web" ask was considered and
narrowed deliberately** (see [architecture.md](./architecture.md)
"Two-source lookup"): scraping arbitrary sites was rejected outright (ToS
risk, no backend to run it on, unverified data breaks Goal 2 below), but
USDA FoodData Central - free, legitimate, no scraping, public-domain US
government branded-food data - was added as a fallback when OFF has no
record. It's real coverage, not a search-engine crawl standing in for one.

## Goals

1. Turn a barcode scan into an honest, source-cited health score in
   seconds - no account, no setup.
2. Never invent a number: every grade shown is the real source's own
   computed value (Open Food Facts' Nutri-Score/NOVA, verbatim), never a
   competing score this app invents - and when a result comes from a
   source that doesn't compute a grade at all (USDA), the app says so
   rather than implying OFF simply hasn't rated it yet.
3. Make a good/bad result worth sharing - the product's differentiation
   is virality, not just utility.

**Non-goals for V1:** user accounts, a premium tier, a proprietary
product database, a native mobile app, offline mode (see
[phases.md](./phases.md) "Deferred").

## Target users

- **Primary:** a shopper in a store deciding between two similar packaged
  products.
- **Secondary:** a parent checking what's actually in a snack before
  buying it for a kid.

## User stories

- As a shopper, I want to scan a barcode and see a grade in seconds, so I
  don't have to squint at a tiny ingredients label in a shop aisle.
- As a shopper, I want the raw sugar/salt/fat numbers next to the grade,
  not just a letter, so I can judge the product myself.
- As a shopper, I want an honest "not in our database yet" message when a
  regional brand isn't covered by either data source, not a guessed grade
  that looks real but isn't.
- As a shopper, I want to share a genuinely bad result with a friend, so
  the app is useful even in the moment I'm not shopping.
- As a returning user, I want my past scans available without creating an
  account, so recurring use doesn't cost me any setup.

## Success metrics

V1 has no backend and no analytics, so success is manually-checkable, not
instrumented:

- **V1 (manual validation):** scanning a well-known, globally-distributed
  product (Coca-Cola, Nutella, Maggi) returns a full result end to end
  within a few seconds on a real device.
- **V1 (manual validation):** scanning a barcode known to be absent from
  both Open Food Facts and USDA renders the honest not-found state, with
  both recovery paths and the OFF contribute link all working.
- **V1 (manual validation):** the share flow produces a real, shareable
  image on both a real Android and a real iOS device.

## Core user flows

### Flow 1 — Scan a product

1. User opens Scanbite and lands on the scan-first home shell (camera
   view, "Enter manually" always visible below it).
2. Camera decodes a barcode, or the user types it / searches by name.
3. A result renders: image, product name/brand, which data source it came
   from, Nutri-Score badge, NOVA badge, per-100g sugar/salt/fat/saturated
   -fat rows, ingredients, allergens - each field independently showing
   "not reported" if the source doesn't have it, rather than the whole
   card failing.

**Acceptance criteria:**

- A checksum-invalid camera misread is silently rejected before ever being
  sent to either data source (see [architecture.md](./architecture.md)).
- A product neither Open Food Facts nor USDA has a record of renders the
  honest not-found state - never a guessed grade.
- A network failure renders visibly differently from a not-found result -
  conflating the two would itself be a small dishonesty.

### Flow 2 — Share a result

1. From a found result, the user taps "Share this result."
2. A canvas-rendered image (grade, headline stat, attribution) is
   generated.
3. On a supporting device, the native share sheet opens with the image
   attached; otherwise, a download link and a copy-link button are
   offered.

**Acceptance criteria:**

- The shared image never states a number the source didn't report - a
  product with no sugar figure shows no sugar headline stat, not a
  fabricated one - and credits whichever source (OFF or USDA) it actually
  came from, never a hardcoded attribution.
- The shareable `?barcode=` URL reopens directly on that result in a fresh
  tab/session, no re-scan needed.

### Flow 3 — A product isn't in the database

1. A scanned/typed/searched barcode returns no record from either Open
   Food Facts or its USDA fallback.
2. The not-found panel states this honestly, including that India
   coverage specifically is still thin in both sources.
3. Two recovery paths (scan another, search by name) plus a direct link to
   Open Food Facts' own contribute form, barcode prefilled.

**Acceptance criteria:**

- This app never builds its own product-submission form - the hand-off to
  OFF's existing pipeline is the correct posture given the "no proprietary
  database" non-goal.

## Out of scope / explicitly deferred

See [phases.md](./phases.md) "Deferred" for the full list and reasoning:
accounts, premium tier, proprietary product database, native app, offline
mode, server-rendered per-product share previews, two-product comparison,
native `BarcodeDetector` API.
