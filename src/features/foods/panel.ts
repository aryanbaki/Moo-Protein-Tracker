/**
 * Full nutrition-facts panel: every nutrient on a US label, read from USDA
 * FoodData Central and Open Food Facts into one shape. Values are per 100 g
 * (or 100 ml) in the unit listed in NUTRIENTS. Pure and dependency-free.
 */
import { isRecord, num, round1 } from './nutrients';

export type NutrientKey =
  | 'calories'
  | 'protein'
  | 'fat'
  | 'saturatedFat'
  | 'transFat'
  | 'monoFat'
  | 'polyFat'
  | 'cholesterol'
  | 'sodium'
  | 'carbs'
  | 'fiber'
  | 'sugars'
  | 'addedSugars'
  | 'potassium'
  | 'calcium'
  | 'iron'
  | 'magnesium'
  | 'zinc'
  | 'vitaminD'
  | 'vitaminA'
  | 'vitaminC'
  | 'caffeine';

export type NutrientUnit = 'kcal' | 'g' | 'mg' | 'µg';

export interface NutrientDef {
  key: NutrientKey;
  label: string;
  unit: NutrientUnit;
  /** Indented under its parent on the label (e.g. Saturated fat under Total fat). */
  sub?: boolean;
  /** FoodData Central nutrient ids, best first (several exist for energy and sugars). */
  usdaIds: number[];
  /** Legacy SR nutrient numbers, used when a response only carries `nutrientNumber`. */
  usdaNumbers: string[];
  /** Open Food Facts nutriment key prefix; OFF stores mass nutrients in grams. */
  off: string | null;
}

/** In label order. */
export const NUTRIENTS: NutrientDef[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', usdaIds: [1008, 2048, 2047], usdaNumbers: ['208', '958', '957'], off: 'energy-kcal' },
  { key: 'fat', label: 'Total fat', unit: 'g', usdaIds: [1004], usdaNumbers: ['204'], off: 'fat' },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g', sub: true, usdaIds: [1258], usdaNumbers: ['606'], off: 'saturated-fat' },
  { key: 'transFat', label: 'Trans fat', unit: 'g', sub: true, usdaIds: [1257], usdaNumbers: ['605'], off: 'trans-fat' },
  { key: 'monoFat', label: 'Monounsaturated fat', unit: 'g', sub: true, usdaIds: [1292], usdaNumbers: ['645'], off: 'monounsaturated-fat' },
  { key: 'polyFat', label: 'Polyunsaturated fat', unit: 'g', sub: true, usdaIds: [1293], usdaNumbers: ['646'], off: 'polyunsaturated-fat' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', usdaIds: [1253], usdaNumbers: ['601'], off: 'cholesterol' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', usdaIds: [1093], usdaNumbers: ['307'], off: 'sodium' },
  { key: 'carbs', label: 'Total carbohydrate', unit: 'g', usdaIds: [1005], usdaNumbers: ['205'], off: 'carbohydrates' },
  { key: 'fiber', label: 'Dietary fiber', unit: 'g', sub: true, usdaIds: [1079], usdaNumbers: ['291'], off: 'fiber' },
  { key: 'sugars', label: 'Total sugars', unit: 'g', sub: true, usdaIds: [2000, 1063], usdaNumbers: ['269', '269.3'], off: 'sugars' },
  { key: 'addedSugars', label: 'Added sugars', unit: 'g', sub: true, usdaIds: [1235], usdaNumbers: ['539'], off: 'added-sugars' },
  { key: 'protein', label: 'Protein', unit: 'g', usdaIds: [1003], usdaNumbers: ['203'], off: 'proteins' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', usdaIds: [1114], usdaNumbers: ['328'], off: 'vitamin-d' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', usdaIds: [1087], usdaNumbers: ['301'], off: 'calcium' },
  { key: 'iron', label: 'Iron', unit: 'mg', usdaIds: [1089], usdaNumbers: ['303'], off: 'iron' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', usdaIds: [1092], usdaNumbers: ['306'], off: 'potassium' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', usdaIds: [1090], usdaNumbers: ['304'], off: 'magnesium' },
  { key: 'zinc', label: 'Zinc', unit: 'mg', usdaIds: [1095], usdaNumbers: ['309'], off: 'zinc' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'µg', usdaIds: [1106], usdaNumbers: ['320'], off: 'vitamin-a' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', usdaIds: [1162], usdaNumbers: ['401'], off: 'vitamin-c' },
  { key: 'caffeine', label: 'Caffeine', unit: 'mg', usdaIds: [1057], usdaNumbers: ['262'], off: 'caffeine' },
];

export type NutrientPanel = Partial<Record<NutrientKey, number>>;

const BY_KEY = new Map(NUTRIENTS.map((n) => [n.key, n]));
export function nutrientDef(key: NutrientKey): NutrientDef {
  return BY_KEY.get(key)!;
}

/** Converts `value` in `from` (a USDA unitName such as "G", "MG", "UG", "µg", "KCAL", "kJ") to `to`. */
export function convertUnit(value: number, from: string, to: NutrientUnit): number | null {
  const f = from.trim().toLowerCase().replace('μ', 'µ');
  if (to === 'kcal') {
    if (f === 'kcal') return value;
    if (f === 'kj') return value / 4.184;
    return null;
  }
  const grams: Record<string, number> = { g: 1, mg: 1e-3, ug: 1e-6, µg: 1e-6, mcg: 1e-6 };
  const target: Record<NutrientUnit, number> = { g: 1, mg: 1e-3, µg: 1e-6, kcal: NaN };
  if (!(f in grams)) return null; // IU and unknown units are not converted (IU→µg depends on the vitamin form)
  return (value * grams[f]!) / target[to];
}

function clean(v: number, unit: NutrientUnit): number {
  // Two decimals for µg/mg-scale values under 10; one otherwise.
  const r = Math.abs(v) < 10 && unit !== 'kcal' ? Math.round(v * 100) / 100 : round1(v);
  return Math.max(0, r);
}

/** USDA foodNutrients (search: flat `{nutrientId, nutrientNumber, unitName, value}`; details: nested `{nutrient:{id,number,unitName}, amount}`). */
export function panelFromUsda(list: unknown): NutrientPanel {
  const out: NutrientPanel = {};
  if (!Array.isArray(list)) return out;
  // Index by id and number so each nutrient resolves in priority order.
  const byId = new Map<number, { value: number; unit: string }>();
  const byNumber = new Map<string, { value: number; unit: string }>();
  for (const n of list) {
    if (!isRecord(n)) continue;
    const nested = isRecord(n.nutrient) ? n.nutrient : null;
    const id = num(n.nutrientId) ?? num(nested?.id);
    const number = typeof n.nutrientNumber === 'string' ? n.nutrientNumber : typeof nested?.number === 'string' ? nested.number : null;
    const value = num(n.value) ?? num(n.amount);
    const unit = typeof n.unitName === 'string' ? n.unitName : typeof nested?.unitName === 'string' ? nested.unitName : '';
    if (value === null) continue;
    if (id !== null && !byId.has(id)) byId.set(id, { value, unit });
    if (number && !byNumber.has(number)) byNumber.set(number, { value, unit });
  }
  for (const def of NUTRIENTS) {
    let hit: { value: number; unit: string } | undefined;
    for (const id of def.usdaIds) if (!hit) hit = byId.get(id);
    for (const nb of def.usdaNumbers) if (!hit) hit = byNumber.get(nb);
    if (!hit) continue;
    // Energy rows without a unit are kcal; other unit-less rows are assumed to be in the label unit.
    const v = hit.unit ? convertUnit(hit.value, hit.unit, def.unit) : hit.value;
    if (v !== null && Number.isFinite(v)) out[def.key] = clean(v, def.unit);
  }
  return out;
}

/** Open Food Facts nutriments for one basis (`_100g` or `_serving`). OFF stores mass nutrients in grams. */
export function panelFromOff(nutriments: unknown, suffix: '_100g' | '_serving' = '_100g'): NutrientPanel {
  const out: NutrientPanel = {};
  if (!isRecord(nutriments)) return out;
  for (const def of NUTRIENTS) {
    if (!def.off) continue;
    if (def.key === 'calories') {
      const kcal = num(nutriments[`energy-kcal${suffix}`]);
      const kj = num(nutriments[`energy-kj${suffix}`]) ?? num(nutriments[`energy${suffix}`]);
      const v = kcal ?? (kj !== null ? kj / 4.184 : null);
      if (v !== null) out.calories = clean(v, 'kcal');
      continue;
    }
    let v = num(nutriments[`${def.off}${suffix}`]);
    // Salt is often given without sodium: sodium = salt / 2.5.
    if (v === null && def.key === 'sodium') {
      const salt = num(nutriments[`salt${suffix}`]);
      if (salt !== null) v = salt / 2.5;
    }
    if (v === null) continue;
    const converted = convertUnit(v, 'g', def.unit);
    if (converted !== null) out[def.key] = clean(converted, def.unit);
  }
  return out;
}

export function scalePanel(panel: NutrientPanel, factor: number): NutrientPanel {
  const out: NutrientPanel = {};
  const k = Number.isFinite(factor) && factor > 0 ? factor : 0;
  for (const [key, v] of Object.entries(panel) as [NutrientKey, number][]) out[key] = clean(v * k, nutrientDef(key).unit);
  return out;
}

/** "12 g", "460 mg", "2.5 µg", "190" (calories). */
export function formatNutrient(key: NutrientKey, value: number): string {
  const { unit } = nutrientDef(key);
  const shown = unit === 'kcal' ? String(Math.round(value)) : value >= 10 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
  return unit === 'kcal' ? shown : `${shown} ${unit}`;
}
