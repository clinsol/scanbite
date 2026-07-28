/**
 * Always-visible "what does A-E / 1-4 mean" explanation - deliberately not
 * a tooltip, since a scoring scale a user has to hover to discover isn't
 * actually transparent.
 */
export function ScoreLegend() {
  return (
    <div className="rounded-lg bg-surface-sunken p-4 text-sm text-ink-muted">
      <p className="mb-2">
        <strong className="text-ink">Nutri-Score</strong>: A (best) to E (worst) - a nutritional
        quality grade computed by Open Food Facts from a product&apos;s ingredients and nutrients.
      </p>
      <p>
        <strong className="text-ink">NOVA group</strong>: 1 (unprocessed) to 4 (ultra-processed) -
        how industrially processed a product is, independent of its Nutri-Score.
      </p>
    </div>
  );
}
