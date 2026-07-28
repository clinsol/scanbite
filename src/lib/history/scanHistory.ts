/**
 * Session/device-local recent-scans list, backed by localStorage. This is
 * the one piece of state Scanbite persists at all (Civic persists nothing
 * - see its rules.md) - it exists specifically to serve recurring usage
 * without needing an account system, which V1 explicitly does not have.
 * Kept as a pure, framework-free module so it's unit-testable like every
 * other lib/ module, with a mocked localStorage standing in for the real
 * one.
 */

export interface ScanHistoryEntry {
  barcode: string;
  productName: string | null;
  nutriscoreGrade: 'a' | 'b' | 'c' | 'd' | 'e' | null;
  /** True when this scan resolved to a not-found result, not a real product. */
  notFound: boolean;
  scannedAt: string;
}

const STORAGE_KEY = 'scanbite:history';
const MAX_ENTRIES = 50;

function readAll(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScanHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: ScanHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage can throw (quota exceeded, private browsing) - history
    // is a nice-to-have, never block the actual scan flow on it.
  }
}

/** Re-scanning the same barcode moves it to the front rather than duplicating it. */
export function addScan(entry: ScanHistoryEntry): void {
  const withoutDuplicate = readAll().filter((existing) => existing.barcode !== entry.barcode);
  writeAll([entry, ...withoutDuplicate].slice(0, MAX_ENTRIES));
}

export function getRecentScans(): ScanHistoryEntry[] {
  return readAll();
}

export function clearHistory(): void {
  writeAll([]);
}
