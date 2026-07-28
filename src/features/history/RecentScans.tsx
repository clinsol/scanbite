import { useState } from 'react';
import { getRecentScans, type ScanHistoryEntry } from '../../lib/history/scanHistory';
import { presentNutriscoreGrade } from '../../lib/health/labelPresentation';
import { Badge } from '../../components/Badge';

interface RecentScansProps {
  onSelect: (barcode: string) => void;
}

/**
 * Rendered on the scan-first home shell. Reads localStorage once via a
 * lazy initializer (not an effect) - this list only changes when a new
 * scan completes, and the parent remounts this after that happens, so
 * there's no reactive subscription to set up.
 */
export function RecentScans({ onSelect }: RecentScansProps) {
  const [scans] = useState<ScanHistoryEntry[]>(() => getRecentScans());

  if (scans.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-semibold text-ink-muted">Recent scans</h3>
      <ul className="space-y-2">
        {scans.slice(0, 10).map((scan) => {
          const presentation = presentNutriscoreGrade(scan.nutriscoreGrade);
          return (
            <li key={scan.barcode}>
              <button
                onClick={() => onSelect(scan.barcode)}
                className="flex w-full items-center justify-between rounded-lg border border-hairline px-3 py-2 text-left transition-colors hover:border-accent hover:bg-surface-sunken"
              >
                <span className="truncate pr-2 text-sm text-ink">
                  {scan.notFound ? `Barcode ${scan.barcode}` : (scan.productName ?? scan.barcode)}
                </span>
                {scan.notFound ? (
                  <span className="text-xs text-ink-faint">Not found</span>
                ) : presentation && scan.nutriscoreGrade ? (
                  <Badge color={presentation.color}>{scan.nutriscoreGrade.toUpperCase()}</Badge>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
