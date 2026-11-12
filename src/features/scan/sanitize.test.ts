import { clampNumber, MAX_ITEMS, parseAnalysis, sanitizeItems } from './sanitize';

describe('sanitizeItems', () => {
  it('maps snake_case model output and rounds', () => {
    expect(sanitizeItems([{ name: '  Chicken   breast ', portion: '150 g', protein_g: 46.26, calories: 247.6, carbs_g: 0, fat_g: 5.44, confidence: 0.816 }])).toEqual([
      { name: 'Chicken breast', portion: '150 g', proteinG: 46.3, calories: 248, carbsG: 0, fatG: 5.4, confidence: 0.82 },
    ]);
  });

  it('accepts camelCase and numeric strings', () => {
    expect(sanitizeItems([{ name: 'Rice', portion: '', proteinG: '4', calories: '200', carbsG: 44, fatG: 0.4 }])[0]).toEqual({
      name: 'Rice', portion: '1 serving', proteinG: 4, calories: 200, carbsG: 44, fatG: 0.4, confidence: 0.5,
    });
  });

  it('clamps out-of-range and non-finite numbers', () => {
    const [i] = sanitizeItems([{ name: 'Odd', portion: 'x', protein_g: -5, calories: 1e9, carbs_g: NaN, fat_g: 'lots', confidence: 7 }]);
    expect(i).toMatchObject({ proteinG: 0, calories: 5000, carbsG: 0, fatG: 0, confidence: 1 });
  });

  it('drops unusable rows and caps the list', () => {
    expect(sanitizeItems('nope')).toEqual([]);
    expect(sanitizeItems([null, 3, { name: '' }, { portion: 'x' }])).toEqual([]);
    expect(sanitizeItems(Array.from({ length: 40 }, (_, n) => ({ name: `Item ${n}` })))).toHaveLength(MAX_ITEMS);
  });

  it('clampNumber falls back', () => {
    expect(clampNumber(undefined, 0, 1, 0.5)).toBe(0.5);
    expect(clampNumber('', 0, 10)).toBe(0);
  });
});

describe('parseAnalysis', () => {
  const tool = (input: unknown) => ({ stop_reason: 'tool_use', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'ok' }, { type: 'tool_use', id: 't', name: 'report_food', input }] });

  it('reads items from the tool call', () => {
    const r = parseAnalysis(tool({ is_food: true, items: [{ name: 'Egg', portion: '1', protein_g: 6, calories: 70, carbs_g: 0.4, fat_g: 5, confidence: 0.9 }] }), 'report_food');
    expect(r).toEqual({ ok: true, items: [{ name: 'Egg', portion: '1', proteinG: 6, calories: 70, carbsG: 0.4, fatG: 5, confidence: 0.9 }] });
  });

  it('returns no_food when the model says so or lists nothing', () => {
    expect(parseAnalysis(tool({ is_food: false, items: [] }), 'report_food')).toEqual({ ok: false, error: 'no_food' });
    expect(parseAnalysis(tool({ is_food: true, items: [] }), 'report_food')).toEqual({ ok: false, error: 'no_food' });
  });

  it('returns server when there is no tool call, a refusal, or junk', () => {
    expect(parseAnalysis({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'hi' }] }, 'report_food')).toEqual({ ok: false, error: 'server' });
    expect(parseAnalysis({ stop_reason: 'refusal', content: [] }, 'report_food')).toEqual({ ok: false, error: 'server' });
    expect(parseAnalysis(tool({ is_food: true, items: [{ name: 'x' }] }), 'other_tool')).toEqual({ ok: false, error: 'server' });
    expect(parseAnalysis(null, 'report_food')).toEqual({ ok: false, error: 'server' });
  });
});

it('the Edge Function copy of sanitize.ts is identical', () => {
  // Jest runs from the repo root; no Node typings in this project, hence requireActual.
  const { readFileSync } = jest.requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('fs');
  const here = readFileSync('src/features/scan/sanitize.ts', 'utf8');
  const edge = readFileSync('supabase/functions/_shared/sanitize.ts', 'utf8');
  expect(edge).toBe(here);
});
