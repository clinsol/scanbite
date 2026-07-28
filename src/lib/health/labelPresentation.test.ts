import { describe, expect, it } from 'vitest';
import { presentNutriscoreGrade, presentNovaGroup } from './labelPresentation';

describe('presentNutriscoreGrade', () => {
  it.each(['a', 'b', 'c', 'd', 'e'] as const)('maps grade %s to a color and label', (grade) => {
    const presentation = presentNutriscoreGrade(grade);
    expect(presentation?.color).toBeTruthy();
    expect(presentation?.label).toBeTruthy();
  });

  it('maps null to "not rated" (no default color)', () => {
    expect(presentNutriscoreGrade(null)).toBeNull();
  });
});

describe('presentNovaGroup', () => {
  it.each([1, 2, 3, 4] as const)('maps NOVA group %s to a color and label', (group) => {
    const presentation = presentNovaGroup(group);
    expect(presentation?.color).toBeTruthy();
    expect(presentation?.label).toBeTruthy();
  });

  it('maps null to "not classified" (no default color)', () => {
    expect(presentNovaGroup(null)).toBeNull();
  });
});
