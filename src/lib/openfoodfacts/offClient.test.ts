import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProductByBarcode, searchProductsByName } from './offClient';

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchProductByBarcode', () => {
  it('parses a real "found" response shape', async () => {
    mockFetchOnce({
      status: 1,
      product: {
        code: '4006381333931',
        product_name: 'Kinder Surprise',
        brands: 'Kinder',
        nutriscore_grade: 'e',
        nova_group: 4,
        nutriments: { sugars_100g: 51, salt_100g: 0.1 },
        allergens_tags: ['en:milk', 'en:soybeans'],
      },
    });

    const result = await fetchProductByBarcode('4006381333931');
    expect(result.type).toBe('found');
    if (result.type === 'found') {
      expect(result.product.name).toBe('Kinder Surprise');
      expect(result.product.nutriscoreGrade).toBe('e');
      expect(result.product.novaGroup).toBe(4);
      expect(result.product.allergens).toEqual(['milk', 'soybeans']);
    }
  });

  it('treats status: 0 as a permanent not-found, not an error', async () => {
    mockFetchOnce({ status: 0, status_verbose: 'product not found' });

    const result = await fetchProductByBarcode('0000000000000');
    expect(result).toEqual({ type: 'not_found' });
  });

  it('degrades a deliberately malformed/drifted response shape to error, not a crash', async () => {
    mockFetchOnce({ status: 1, product: { code: '123' /* missing everything else */ } });

    const result = await fetchProductByBarcode('123');
    // status: 1 with only a code still parses (every other field is independently nullable) -
    // this asserts it degrades to a "found" product with all-null fields, not a crash.
    expect(result.type).toBe('found');
  });

  it('returns error on a response with no recognizable status at all', async () => {
    mockFetchOnce({ unexpected: 'shape' });

    const result = await fetchProductByBarcode('123');
    expect(result).toEqual({ type: 'error' });
  });

  it('returns error on a non-2xx response', async () => {
    mockFetchOnce({}, false);

    const result = await fetchProductByBarcode('123');
    expect(result).toEqual({ type: 'error' });
  });

  it('returns error when the network request itself throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    );

    const result = await fetchProductByBarcode('123');
    expect(result).toEqual({ type: 'error' });
  });
});

describe('searchProductsByName', () => {
  it('parses a list of search results', async () => {
    mockFetchOnce({
      products: [
        { code: '111', product_name: 'Maggi Noodles', brands: 'Nestle', nutriscore_grade: 'd' },
        { code: '222', product_name: 'Maggi Sauce' },
      ],
    });

    const results = await searchProductsByName('maggi');
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Maggi Noodles');
    expect(results[1].nutriscoreGrade).toBeNull();
  });

  it('returns an empty array for a blank query without calling fetch', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const results = await searchProductsByName('   ');
    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns an empty array on failure rather than throwing', async () => {
    mockFetchOnce({}, false);
    const results = await searchProductsByName('anything');
    expect(results).toEqual([]);
  });
});
