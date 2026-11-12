import { addGrams, amountToText, parseAmount, pressKey, sanitizeAmountInput, validateEntryForm, type KeypadKey } from './form';

const blank = { name: '', protein: '', calories: '', carbs: '', fat: '' };

describe('parseAmount', () => {
  it('parses decimals with dot or comma', () => {
    expect(parseAmount('12')).toBe(12);
    expect(parseAmount(' 12.5 ')).toBe(12.5);
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount('.5')).toBe(0.5);
    expect(parseAmount('7.')).toBe(7);
  });
  it('returns null for blank and NaN for junk', () => {
    expect(parseAmount('  ')).toBeNull();
    for (const bad of ['abc', '-5', '1e3', '1.2.3', '12g', '.']) expect(parseAmount(bad)).toBeNaN();
  });
});

describe('sanitizeAmountInput', () => {
  it('strips everything but digits and one dot', () => {
    expect(sanitizeAmountInput('1a2,5.6g')).toBe('12.56');
    expect(sanitizeAmountInput('-40')).toBe('40');
    expect(sanitizeAmountInput('123456789')).toBe('123456');
  });
});

describe('validateEntryForm', () => {
  it('accepts a full manual entry and treats blank macros as 0', () => {
    expect(validateEntryForm({ ...blank, name: '  Greek  yogurt ', protein: '17,5' }, 'manual')).toEqual({
      ok: true,
      entry: { name: 'Greek yogurt', proteinG: 17.5, calories: 0, carbsG: 0, fatG: 0 },
    });
  });
  it('allows 0 g protein in manual mode (a banana still counts)', () => {
    expect(validateEntryForm({ ...blank, name: 'Banana', protein: '0', calories: '105' }, 'manual').ok).toBe(true);
  });
  it('requires a name and protein in manual mode', () => {
    const r = validateEntryForm(blank, 'manual');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['name', 'protein']);
  });
  it('quick mode needs more than 0 g but no name', () => {
    expect(validateEntryForm({ ...blank, protein: '25' }, 'quick')).toEqual({ ok: true, entry: { name: '', proteinG: 25, calories: 0, carbsG: 0, fatG: 0 } });
    expect(validateEntryForm({ ...blank, protein: '0' }, 'quick').ok).toBe(false);
    expect(validateEntryForm(blank, 'quick').ok).toBe(false);
  });
  it('flags junk and absurd numbers per field', () => {
    const r = validateEntryForm({ name: 'x', protein: '900', calories: 'lots', carbs: '5000', fat: '2' }, 'manual');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.protein).toMatch(/500/);
      expect(r.errors.calories).toMatch(/number/);
      expect(r.errors.carbs).toMatch(/1,000/);
      expect(r.errors.fat).toBeUndefined();
    }
  });
});

describe('keypad', () => {
  const type = (keys: KeypadKey[], start = '') => keys.reduce(pressKey, start);
  it('builds a number and limits its size', () => {
    expect(type(['2', '5'])).toBe('25');
    expect(type(['1', '2', '3', '4'])).toBe('123');
    expect(type(['0', '0', '7'])).toBe('7');
    expect(type(['.', '5', '5'])).toBe('0.5');
    expect(type(['1', '.', '.', '2'])).toBe('1.2');
  });
  it('backspaces to empty', () => {
    expect(type(['back', 'back', 'back'], '25')).toBe('');
  });
  it('chips add on top and cap at the limit', () => {
    expect(addGrams('', 20)).toBe('20');
    expect(addGrams('12.5', 10)).toBe('22.5');
    expect(addGrams('495', 30)).toBe('500');
  });
});

describe('amountToText', () => {
  it('formats for a field', () => {
    expect(amountToText(12)).toBe('12');
    expect(amountToText(12.34)).toBe('12.3');
    expect(amountToText(0)).toBe('0');
    expect(amountToText(0, true)).toBe('');
  });
});
