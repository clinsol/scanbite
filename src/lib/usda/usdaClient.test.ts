import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProductByBarcodeFromUsda, searchProductsByNameFromUsda } from './usdaClient';

function mockFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(body),
    })
  );
}

const CHEERIOS_FOOD = {
  fdcId: 2517161,
  description: 'Cheerios Cereal',
  brandOwner: 'General Mills',
  gtinUpc: '00016000275287',
  ingredients: 'WHOLE GRAIN OATS, CORN STARCH, SUGAR, SALT.',
  foodNutrients: [
    { nutrientNumber: '204', value: 6.41 },
    { nutrientNumber: '269', value: 5.13 },
    { nutrientNumber: '606', value: 0.5 },
    { nutrientNumber: '307', value: 375 },
    { nutrientNumber: '208', value: 359 },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchProductByBarcodeFromUsda', () => {
  it('finds an exact gtinUpc match against the zero-padded 14-digit form and keeps the original scanned code', async () => {
    mockFetchOnce({ foods: [CHEERIOS_FOOD] });

    const product = await fetchProductByBarcodeFromUsda('016000275287');
    expect(product).not.toBeNull();
    expect(product?.code).toBe('016000275287');
    expect(product?.name).toBe('Cheerios Cereal');
    expect(product?.brands).toBe('General Mills');
    expect(product?.nutrients.fat100g).toBe(6.41);
    expect(product?.nutrients.sugars100g).toBe(5.13);
    expect(product?.nutrients.saturatedFat100g).toBe(0.5);
    expect(product?.nutrients.salt100g).toBeCloseTo(0.9375);
    expect(product?.nutrients.energyKcal100g).toBe(359);
    expect(product?.nutriscoreGrade).toBeNull();
    expect(product?.novaGroup).toBeNull();
    expect(product?.source).toBe('usda');
  });

  it('returns null when no result has a matching gtinUpc, rather than guessing the closest text match', async () => {
    mockFetchOnce({ foods: [CHEERIOS_FOOD] });

    const product = await fetchProductByBarcodeFromUsda('999999999999');
    expect(product).toBeNull();
  });

  it('returns null on a non-2xx response instead of throwing', async () => {
    mockFetchOnce({}, false);
    const product = await fetchProductByBarcodeFromUsda('016000275287');
    expect(product).toBeNull();
  });

  it('returns null when the network request itself throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const product = await fetchProductByBarcodeFromUsda('016000275287');
    expect(product).toBeNull();
  });
});

describe('searchProductsByNameFromUsda', () => {
  it('maps search results, skipping entries with no gtinUpc to look up later', async () => {
    mockFetchOnce({ foods: [CHEERIOS_FOOD, { ...CHEERIOS_FOOD, gtinUpc: undefined }] });

    const results = await searchProductsByNameFromUsda('cheerios');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('00016000275287');
    expect(results[0].source).toBe('usda');
  });

  it('returns an empty array for a blank query without calling fetch', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const results = await searchProductsByNameFromUsda('   ');
    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns an empty array on failure rather than throwing', async () => {
    mockFetchOnce({}, false);
    const results = await searchProductsByNameFromUsda('anything');
    expect(results).toEqual([]);
  });
});
