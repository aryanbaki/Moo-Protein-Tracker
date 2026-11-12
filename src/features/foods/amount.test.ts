import { gramsToServings, servingsToGrams } from './amount';

describe('amount', () => {
  it('converts typed grams to servings', () => {
    expect(gramsToServings('150', 100)).toBe(1.5);
    expect(gramsToServings('62,5', 31)).toBe(2.016);
    expect(gramsToServings(' 45 ', 60)).toBe(0.75);
  });
  it('rejects unusable input', () => {
    expect(gramsToServings('', 100)).toBeNull();
    expect(gramsToServings('abc', 100)).toBeNull();
    expect(gramsToServings('0', 100)).toBeNull();
    expect(gramsToServings('5000', 100)).toBeNull();
    expect(gramsToServings('100', 0)).toBeNull();
  });
  it('shows whole grams', () => {
    expect(servingsToGrams(2.016, 31)).toBe(62);
    expect(servingsToGrams(1.5, 100)).toBe(150);
  });
});
