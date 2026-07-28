/** Required ODbL attribution - Open Food Facts' data license requires crediting the contributor community, not just the API. USDA FoodData Central is public-domain US government data and needs no license attribution, but is credited anyway for the same transparency reason every result shows its source (see ProductResult.tsx). */
export function AttributionFooter() {
  return (
    <footer className="border-t border-hairline px-4 py-6 text-center text-xs leading-relaxed text-ink-faint">
      Product data from{' '}
      <a
        href="https://world.openfoodfacts.org"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        Open Food Facts
      </a>{' '}
      contributors, licensed under{' '}
      <a
        href="https://opendatacommons.org/licenses/odbl/"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        ODbL
      </a>
      , and{' '}
      <a
        href="https://fdc.nal.usda.gov"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        USDA FoodData Central
      </a>
      . Not in the database yet? You can add it to Open Food Facts directly.
    </footer>
  );
}
