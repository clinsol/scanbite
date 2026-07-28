import { describe, expect, it, vi } from 'vitest';
import { lookupProduct, searchProducts } from './productLookup';
import * as offClient from '../openfoodfacts/offClient';
import * as usdaClient from '../usda/usdaClient';
import type { Product } from '../openfoodfacts/offTypes';

const OFF_PRODUCT: Product = {
  code: '123',
  name: 'OFF Product',
  brands: null,
  imageUrl: null,
  nutriscoreGrade: 'b',
  novaGroup: 2,
  ingredientsText: null,
  allergens: [],
  nutrients: { sugars100g: null, salt100g: null, fat100g: null, saturatedFat100g: null, energyKcal100g: null },
  source: 'openfoodfacts',
};

const USDA_PRODUCT: Product = { ...OFF_PRODUCT, name: 'USDA Product', nutriscoreGrade: null, novaGroup: null, source: 'usda' };

describe('lookupProduct', () => {
  it('returns the OFF result immediately without touching USDA when OFF already found it', async () => {
    vi.spyOn(offClient, 'fetchProductByBarcode').mockResolvedValue({ type: 'found', product: OFF_PRODUCT });
    const usdaSpy = vi.spyOn(usdaClient, 'fetchProductByBarcodeFromUsda');

    const result = await lookupProduct('123');
    expect(result).toEqual({ type: 'found', product: OFF_PRODUCT });
    expect(usdaSpy).not.toHaveBeenCalled();
  });

  it('falls back to USDA when OFF has no record, and tags the result as usda-sourced', async () => {
    vi.spyOn(offClient, 'fetchProductByBarcode').mockResolvedValue({ type: 'not_found' });
    vi.spyOn(usdaClient, 'fetchProductByBarcodeFromUsda').mockResolvedValue(USDA_PRODUCT);

    const result = await lookupProduct('123');
    expect(result).toEqual({ type: 'found', product: USDA_PRODUCT });
  });

  it('reports not_found when both OFF and the USDA fallback have nothing', async () => {
    vi.spyOn(offClient, 'fetchProductByBarcode').mockResolvedValue({ type: 'not_found' });
    vi.spyOn(usdaClient, 'fetchProductByBarcodeFromUsda').mockResolvedValue(null);

    const result = await lookupProduct('123');
    expect(result).toEqual({ type: 'not_found' });
  });

  it('still tries USDA when OFF itself failed (a transient error is not a verdict), and uses USDA if it finds one', async () => {
    vi.spyOn(offClient, 'fetchProductByBarcode').mockResolvedValue({ type: 'error' });
    vi.spyOn(usdaClient, 'fetchProductByBarcodeFromUsda').mockResolvedValue(USDA_PRODUCT);

    const result = await lookupProduct('123');
    expect(result).toEqual({ type: 'found', product: USDA_PRODUCT });
  });

  it('preserves error (not downgrading to not_found) when OFF failed and USDA also came up empty', async () => {
    vi.spyOn(offClient, 'fetchProductByBarcode').mockResolvedValue({ type: 'error' });
    vi.spyOn(usdaClient, 'fetchProductByBarcodeFromUsda').mockResolvedValue(null);

    const result = await lookupProduct('123');
    expect(result).toEqual({ type: 'error' });
  });
});

describe('searchProducts', () => {
  it('returns OFF results without calling USDA when OFF already has matches', async () => {
    vi.spyOn(offClient, 'searchProductsByName').mockResolvedValue([
      { code: '1', name: 'A', brands: null, imageUrl: null, nutriscoreGrade: 'a', source: 'openfoodfacts' },
    ]);
    const usdaSpy = vi.spyOn(usdaClient, 'searchProductsByNameFromUsda');

    const results = await searchProducts('a');
    expect(results).toHaveLength(1);
    expect(usdaSpy).not.toHaveBeenCalled();
  });

  it('falls back to USDA search when OFF has zero matches', async () => {
    vi.spyOn(offClient, 'searchProductsByName').mockResolvedValue([]);
    vi.spyOn(usdaClient, 'searchProductsByNameFromUsda').mockResolvedValue([
      { code: '2', name: 'B', brands: null, imageUrl: null, nutriscoreGrade: null, source: 'usda' },
    ]);

    const results = await searchProducts('b');
    expect(results).toHaveLength(1);
    expect(results[0].source).toBe('usda');
  });
});
