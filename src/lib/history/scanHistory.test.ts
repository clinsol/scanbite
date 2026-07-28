import { beforeEach, describe, expect, it } from 'vitest';
import { addScan, clearHistory, getRecentScans } from './scanHistory';

describe('scanHistory', () => {
  beforeEach(() => {
    clearHistory();
  });

  it('returns an empty list when nothing has been scanned', () => {
    expect(getRecentScans()).toEqual([]);
  });

  it('adds a scan and returns it most-recent-first', () => {
    addScan({
      barcode: '111',
      productName: 'First',
      nutriscoreGrade: 'a',
      notFound: false,
      scannedAt: '2026-01-01T00:00:00.000Z',
    });
    addScan({
      barcode: '222',
      productName: 'Second',
      nutriscoreGrade: 'c',
      notFound: false,
      scannedAt: '2026-01-02T00:00:00.000Z',
    });

    const scans = getRecentScans();
    expect(scans).toHaveLength(2);
    expect(scans[0].barcode).toBe('222');
    expect(scans[1].barcode).toBe('111');
  });

  it('re-scanning the same barcode moves it to the front instead of duplicating it', () => {
    addScan({
      barcode: '111',
      productName: 'First',
      nutriscoreGrade: 'a',
      notFound: false,
      scannedAt: '2026-01-01T00:00:00.000Z',
    });
    addScan({
      barcode: '222',
      productName: 'Second',
      nutriscoreGrade: 'c',
      notFound: false,
      scannedAt: '2026-01-02T00:00:00.000Z',
    });
    addScan({
      barcode: '111',
      productName: 'First',
      nutriscoreGrade: 'a',
      notFound: false,
      scannedAt: '2026-01-03T00:00:00.000Z',
    });

    const scans = getRecentScans();
    expect(scans).toHaveLength(2);
    expect(scans[0].barcode).toBe('111');
  });

  it('clears the history', () => {
    addScan({
      barcode: '111',
      productName: 'First',
      nutriscoreGrade: 'a',
      notFound: false,
      scannedAt: '2026-01-01T00:00:00.000Z',
    });
    clearHistory();
    expect(getRecentScans()).toEqual([]);
  });
});
