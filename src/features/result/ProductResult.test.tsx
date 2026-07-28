import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductResult } from './ProductResult';
import type { Product } from '../../lib/openfoodfacts/offTypes';

const noop = () => {};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    code: '4006381333931',
    name: 'Test Snack',
    brands: 'Test Brand',
    imageUrl: null,
    nutriscoreGrade: 'c',
    novaGroup: 3,
    ingredientsText: 'sugar, flour',
    allergens: ['milk'],
    nutrients: {
      sugars100g: 20,
      salt100g: 1,
      fat100g: 5,
      saturatedFat100g: 2,
      energyKcal100g: 400,
    },
    source: 'openfoodfacts',
    ...overrides,
  };
}

describe('ProductResult', () => {
  it('renders the loading state', () => {
    render(
      <ProductResult
        isLoading
        result={null}
        barcode="123"
        onRetry={noop}
        onScanAnother={noop}
        onSearchInstead={noop}
        onShare={noop}
      />
    );
    expect(screen.getByTestId('product-result-loading')).toBeInTheDocument();
  });

  it('renders the not_found state with recovery actions and no fabricated data', () => {
    render(
      <ProductResult
        isLoading={false}
        result={{ type: 'not_found' }}
        barcode="0000000000000"
        onRetry={noop}
        onScanAnother={noop}
        onSearchInstead={noop}
        onShare={noop}
      />
    );
    expect(screen.getByText('Not in our database yet')).toBeInTheDocument();
    expect(screen.getByText('Scan a different product')).toBeInTheDocument();
    expect(screen.getByText('Search by name instead')).toBeInTheDocument();
    expect(screen.getByText('Add this product to Open Food Facts')).toBeInTheDocument();
  });

  it('renders the error state distinctly from not_found, with a retry action', async () => {
    const onRetry = vi.fn();
    render(
      <ProductResult
        isLoading={false}
        result={{ type: 'error' }}
        barcode="123"
        onRetry={onRetry}
        onScanAnother={noop}
        onSearchInstead={noop}
        onShare={noop}
      />
    );
    expect(screen.getByTestId('product-result-error')).toBeInTheDocument();
    expect(screen.queryByText('Not in our database yet')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the found state with every field, and calls onShare with the product', async () => {
    const onShare = vi.fn();
    const product = makeProduct();
    render(
      <ProductResult
        isLoading={false}
        result={{ type: 'found', product }}
        barcode={product.code}
        onRetry={noop}
        onScanAnother={noop}
        onSearchInstead={noop}
        onShare={onShare}
      />
    );
    expect(screen.getByTestId('product-result-found')).toBeInTheDocument();
    expect(screen.getByText('Test Snack')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Share this result'));
    expect(onShare).toHaveBeenCalledWith(product);
  });

  it('credits USDA and explains missing Nutri-Score/NOVA honestly for a USDA-sourced product', () => {
    const product = makeProduct({
      source: 'usda',
      nutriscoreGrade: null,
      novaGroup: null,
      ingredientsText: null,
      allergens: [],
    });
    render(
      <ProductResult
        isLoading={false}
        result={{ type: 'found', product }}
        barcode={product.code}
        onRetry={noop}
        onScanAnother={noop}
        onSearchInstead={noop}
        onShare={noop}
      />
    );
    expect(screen.getByText('Data from USDA FoodData Central')).toBeInTheDocument();
    expect(
      screen.getByText("Not rated - Nutri-Score isn't computed by USDA FoodData Central")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Not classified - NOVA group isn't computed by USDA FoodData Central")
    ).toBeInTheDocument();
    expect(screen.getByText('Not reported by USDA FoodData Central')).toBeInTheDocument();
    expect(screen.getByText('None reported by USDA FoodData Central')).toBeInTheDocument();
  });

  it('renders "not reported" for missing fields instead of fabricating a value', () => {
    const product = makeProduct({
      ingredientsText: null,
      allergens: [],
      nutrients: { sugars100g: null, salt100g: null, fat100g: null, saturatedFat100g: null, energyKcal100g: null },
    });
    render(
      <ProductResult
        isLoading={false}
        result={{ type: 'found', product }}
        barcode={product.code}
        onRetry={noop}
        onScanAnother={noop}
        onSearchInstead={noop}
        onShare={noop}
      />
    );
    expect(screen.getAllByText('Not reported').length).toBeGreaterThan(0);
    expect(screen.getByText('Not reported by Open Food Facts contributors')).toBeInTheDocument();
    expect(screen.getByText('None reported by Open Food Facts contributors')).toBeInTheDocument();
  });
});
