// Moo: food text/barcode search through USDA FoodData Central. Supabase Edge Function (Deno).
//
// Keeps the free api.data.gov key (secret USDA_API_KEY) out of the app bundle.
// The app maps the response itself (src/features/foods/usda.ts), so this is a
// thin, validated pass-through that trims each hit to the fields the app reads.
//
// POST { query: string, dataType?: string[], pageSize?: number }
// 200  { foods: [...] }           same shape as USDA /foods/search, trimmed
// 400  { error: 'bad_request' }   429 { error: 'rate_limited' }   5xx { error: 'server' }
//
// Called with the anon key (no account needed: food search works in local-only
// mode too). Never logs the query: only short status tags.
import { corsHeaders, json } from '../_shared/cors.ts';

const USDA_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const DATA_TYPES = new Set(['Branded', 'Foundation', 'SR Legacy', 'Survey (FNDDS)']);
// Every nutrient the app's nutrition panel reads (src/features/foods/panel.ts NUTRIENTS) plus kJ.
const KEEP_NUTRIENTS = new Set([1003, 1004, 1005, 1008, 1057, 1062, 1063, 1079, 1087, 1089, 1090, 1092, 1093, 1095, 1106, 1114, 1162, 1235, 1253, 1257, 1258, 1292, 1293, 2000, 2047, 2048]);
const TIMEOUT_MS = 10_000;

type Hit = Record<string, unknown>;

function trim(food: Hit): Hit {
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  return {
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    gtinUpc: food.gtinUpc,
    brandOwner: food.brandOwner,
    brandName: food.brandName,
    servingSize: food.servingSize,
    servingSizeUnit: food.servingSizeUnit,
    householdServingFullText: food.householdServingFullText,
    foodNutrients: nutrients
      .filter((n: Hit) => KEEP_NUTRIENTS.has(Number(n?.nutrientId)))
      .map((n: Hit) => ({ nutrientId: n.nutrientId, nutrientNumber: n.nutrientNumber, unitName: n.unitName, value: n.value })),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const apiKey = Deno.env.get('USDA_API_KEY');
  if (!apiKey) {
    console.error('food-search: missing configuration');
    return json({ error: 'server' }, 500);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const { query, dataType, pageSize } = (payload ?? {}) as { query?: unknown; dataType?: unknown; pageSize?: unknown };
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 100) return json({ error: 'bad_request' }, 400);
  const types = Array.isArray(dataType) ? dataType.filter((t): t is string => typeof t === 'string' && DATA_TYPES.has(t)) : [...DATA_TYPES];
  const size = Math.min(50, Math.max(1, Number.isFinite(Number(pageSize)) ? Number(pageSize) : 25));

  let res: Response;
  try {
    res = await fetch(`${USDA_URL}?api_key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), dataType: types.length ? types : [...DATA_TYPES], pageSize: size }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    console.error('food-search: upstream unreachable');
    return json({ error: 'server' }, 502);
  }
  if (res.status === 429) return json({ error: 'rate_limited' }, 429);
  if (!res.ok) {
    console.error(`food-search: upstream failed (${res.status})`);
    return json({ error: 'server' }, 502);
  }
  const body = (await res.json().catch(() => null)) as { foods?: unknown } | null;
  const foods = Array.isArray(body?.foods) ? (body!.foods as Hit[]).map(trim) : [];
  return json({ foods }, 200);
});
