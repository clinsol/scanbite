import { Badge } from '../../components/Badge';
import { presentNovaGroup } from '../../lib/health/labelPresentation';
import type { Product } from '../../lib/openfoodfacts/offTypes';

interface NovaBadgeProps {
  group: Product['novaGroup'];
  source: Product['source'];
}

export function NovaBadge({ group, source }: NovaBadgeProps) {
  const presentation = presentNovaGroup(group);

  if (!presentation || !group) {
    return (
      <span className="text-sm text-ink-faint">
        {source === 'usda'
          ? "Not classified - NOVA group isn't computed by USDA FoodData Central"
          : 'Not classified by Open Food Facts'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge color={presentation.color}>NOVA {group}</Badge>
      <span className="text-sm text-ink-muted">{presentation.label}</span>
    </div>
  );
}
