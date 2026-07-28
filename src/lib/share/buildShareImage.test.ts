import { describe, expect, it } from 'vitest';
import { buildShareCardContent } from './buildShareImage';
import type { Product } from '../openfoodfacts/offTypes';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    code: '123',
    name: 'Test Snack',
    brands: 'Test Brand',
    imageUrl: null,
    nutriscoreGrade: 'd',
    novaGroup: 4,
    ingredientsText: null,
    allergens: [],
    nutrients: {
      sugars100g: 20,
      salt100g: null,
      fat100g: null,
      saturatedFat100g: null,
      energyKcal100g: null,
    },
    source: 'openfoodfacts',
    ...overrides,
  };
}

describe('buildShareCardContent', () => {
  it('derives grade letter, color, and label from a real grade', () => {
    const content = buildShareCardContent(makeProduct());
    expect(content.gradeLetter).toBe('D');
    expect(content.gradeColor).toBeTruthy();
    expect(content.gradeLabel).toBeTruthy();
  });

  it('never fabricates a headline stat when OFF has no sugar figure', () => {
    const content = buildShareCardContent(
      makeProduct({ nutrients: { sugars100g: null, salt100g: null, fat100g: null, saturatedFat100g: null, energyKcal100g: null } })
    );
    expect(content.headlineStat).toBeNull();
  });

  it('includes the real gram figure and a teaspoon equivalent when sugar is present', () => {
    const content = buildShareCardContent(makeProduct({ nutrients: { sugars100g: 8, salt100g: null, fat100g: null, saturatedFat100g: null, energyKcal100g: null } }));
    expect(content.headlineStat).toContain('8g sugar');
    expect(content.headlineStat).toContain('2.0 tsp');
  });

  it('never fabricates grade info for an unrated product', () => {
    const content = buildShareCardContent(makeProduct({ nutriscoreGrade: null }));
    expect(content.gradeLetter).toBeNull();
    expect(content.gradeColor).toBeNull();
    expect(content.gradeLabel).toBeNull();
  });

  it('falls back to a generic name when OFF has none', () => {
    const content = buildShareCardContent(makeProduct({ name: null }));
    expect(content.productName).toBe('This product');
  });

  it('carries the product source through so the card can credit the real data provider', () => {
    const content = buildShareCardContent(makeProduct({ source: 'usda' }));
    expect(content.source).toBe('usda');
  });
});
