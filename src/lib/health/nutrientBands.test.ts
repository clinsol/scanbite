import { describe, expect, it } from 'vitest';
import { classifyNutrient, sugarGramsToTeaspoons } from './nutrientBands';

describe('classifyNutrient', () => {
  it('returns null when the figure is missing', () => {
    expect(classifyNutrient('sugar', null)).toBeNull();
  });

  describe('sugar (FSA thresholds: low <=5, medium <=22.5, high above)', () => {
    it('is low exactly at the boundary', () => {
      expect(classifyNutrient('sugar', 5)).toBe('low');
    });
    it('is medium just above the low boundary', () => {
      expect(classifyNutrient('sugar', 5.1)).toBe('medium');
    });
    it('is medium exactly at the high boundary', () => {
      expect(classifyNutrient('sugar', 22.5)).toBe('medium');
    });
    it('is high just above the high boundary', () => {
      expect(classifyNutrient('sugar', 22.6)).toBe('high');
    });
  });

  describe('fat (FSA thresholds: low <=3, medium <=17.5, high above)', () => {
    it('is low exactly at the boundary', () => {
      expect(classifyNutrient('fat', 3)).toBe('low');
    });
    it('is high just above the high boundary', () => {
      expect(classifyNutrient('fat', 17.6)).toBe('high');
    });
  });

  describe('saturatedFat (FSA thresholds: low <=1.5, medium <=5, high above)', () => {
    it('is low exactly at the boundary', () => {
      expect(classifyNutrient('saturatedFat', 1.5)).toBe('low');
    });
    it('is high just above the high boundary', () => {
      expect(classifyNutrient('saturatedFat', 5.1)).toBe('high');
    });
  });

  describe('salt (FSA thresholds: low <=0.3, medium <=1.5, high above)', () => {
    it('is low exactly at the boundary', () => {
      expect(classifyNutrient('salt', 0.3)).toBe('low');
    });
    it('is medium just above the low boundary', () => {
      expect(classifyNutrient('salt', 0.31)).toBe('medium');
    });
    it('is high just above the high boundary', () => {
      expect(classifyNutrient('salt', 1.51)).toBe('high');
    });
  });
});

describe('sugarGramsToTeaspoons', () => {
  it('converts using the common 1 tsp ~= 4g approximation', () => {
    expect(sugarGramsToTeaspoons(8)).toBe(2);
  });
});
