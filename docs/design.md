# Scanbite — Design System

## Palette

The accent and semantic good/medium/poor colors deliberately echo
Nutri-Score's own A-E palette (dark green to red) - reinventing a
different color language would work against recognition users already
have from the grading scale itself, not for it.

```
--color-canvas: #f6f8f4        page background, a soft off-white green
--color-surface: #ffffff       cards
--color-surface-sunken: #edf2e8 recessed panels (legend, filled search results)
--color-hairline: #dde5d6      borders
--color-ink / ink-muted / ink-faint   text, in decreasing emphasis
--color-accent: #2e7d32        primary actions (a Nutri-Score "A" green)

--color-good: #1e7d32   / --color-medium: #d98c1d / --color-poor: #c62828
```

## Typography

System font stack (`ui-sans-serif, system-ui, ...`) - no Google Fonts
dependency, one less external origin in the CSP, and no meaningful brand
requirement pulling toward a specific typeface for a utility scan-and-read
tool.

## The 4-state component convention

`ProductResult.tsx` is Scanbite's `HeroCard` - the one component explicitly
designed to own all 4 states a lookup can be in: loading (skeleton
shimmer, matching Civic's own shimmer animation and
`prefers-reduced-motion` handling), not_found, error, and found. A
regression here (an unhandled state silently rendering nothing) is the
most visible possible bug, so every branch is explicit.

## Never a black box

- `ScoreLegend.tsx` explaining what A-E and NOVA 1-4 mean is always
  visible under a found result, never a tooltip a user has to discover -
  a scale that requires hovering to understand isn't actually transparent.
- Every nutrient row shows the real number from Open Food Facts next to
  its low/medium/high color dot - never just the dot alone.
- `AttributionFooter.tsx`'s ODbL credit is a permanent footer, not
  something buried in an about page.

## Per-field honesty, not just per-product

A "found" result can still be missing individual fields. `NutriScoreBadge`,
`NovaBadge`, each `NutrientRow`, `IngredientsPanel`, and `AllergensList`
each independently render their own "not reported by Open Food Facts
contributors" state rather than assuming the rest of the product object is
complete. This is the direct analog of Civic's independently-omittable
sub-scores.

## Layout

Single-column, mobile-first, capped at `max-w-lg` - this is a phone-in-hand,
standing-in-a-shop-aisle tool, not a desktop dashboard. No sidebar, no
dashboard shell the way Civic has one - Scanbite is one continuous scroll:
header -> scan/result -> attribution footer.

## Share card

1080x1080 (Instagram/WhatsApp-square), drawn via Canvas 2D: grade circle,
product name, brand, grade label, one real headline stat (never
fabricated when Open Food Facts has no figure), and the required
attribution line. Kept deliberately simple - one glance, one grade, one
number - since it has to read at thumbnail size in a chat thread.
