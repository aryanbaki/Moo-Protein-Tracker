// Moo: photo → nutrition estimate. Supabase Edge Function (Deno).
//
// POST { image_base64: string, media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }
// 200  { items: CleanItem[], source: 'photo' }   items may carry `hints` for the app's protein model
// 401  { error: 'unauthorized' }   no/invalid JWT, or an anonymous user
// 402  { error: 'limit' }          free user has used every free scan
// 422  { error: 'no_food' }        nothing edible in the picture
// 400  { error: 'bad_request' }    413 { error: 'too_large' }    5xx { error: 'server' }
//
// Never logs the image, the request body or any key: only short status tags.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';
import { parseAnalysis } from '../_shared/sanitize.ts';

const FREE_PHOTO_SCANS = 3;
/** ~4 MB of base64 text (about 3 MB of image). The app sends ≤1024 px JPEGs, far below this. */
const MAX_BASE64_CHARS = 4_000_000;
const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2026-10-21';
const DEFAULT_MODEL = 'claude-sonnet-5-5';
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
/** Models that accept the server-side `fallbacks` parameter (retries a safety decline on another model). */
const FALLBACK_MODELS = new Set(['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-fable-5-2']);
const TOOL_NAME = 'report_food';
const REQUEST_TIMEOUT_MS = 50_000;

const SYSTEM_PROMPT = [
  'You estimate nutrition from a single photo of food for a protein-tracking app. Protein is what matters most.',
  `Always answer by calling the ${TOOL_NAME} tool exactly once; do not answer in plain text.`,
  'List each distinct food or drink you can see as its own item (at most 8), with a short plain name, the portion you see in everyday units plus an approximate weight or volume (for example "1 fillet, about 140 g"), and your best estimate of protein, calories, carbohydrate and fat for that portion.',
  'Estimate the portion actually visible, using plates, cutlery, hands and packaging for scale. Keep calories consistent with the macros (4 kcal per g protein and carbohydrate, 9 per g fat).',
  'For every item also fill in: kind (packaged = a wrapped or boxed product, whole_food = a single recognisable food such as chicken, eggs or rice, mixed_dish = several foods combined such as a burrito, curry or salad, drink); grams, grams_low and grams_high = your best guess and a realistic low and high for the edible weight in grams (ml for drinks); cook_state (raw, cooked, not_applicable, unknown); and db_query = a short generic name a nutrition database would use, with the preparation, e.g. "chicken breast roasted", "egg hard-boiled", "greek yogurt plain nonfat".',
  'Weights matter more than anything else for protein: judge cooked meat and fish by their cooked weight, and say cooked when it is cooked.',
  'If a brand or product name is printed on a package, copy it into brand and product exactly. If barcode digits are clearly readable, copy them into barcode; never guess digits.',
  'If a nutrition facts label is readable, copy its per-serving numbers into label exactly as printed (serving_text, serving_size_g, protein_g, calories, carbs_g, fat_g) and set servings to how many label servings are shown or being eaten (default 1). Never invent label numbers you cannot read; use null for anything not visible.',
  'Set confidence from 0 to 1 per item: lower it when the food is partly hidden, mixed, sauced, or the portion is hard to judge.',
  'If the photo shows no food or drink, call the tool with is_food false and an empty items list. Never invent food that is not visible.',
].join(' ');

const NULLABLE_NUMBER = { type: ['number', 'null'] };
const NULLABLE_STRING = { type: ['string', 'null'] };

const TOOL = {
  name: TOOL_NAME,
  description: 'Report the foods visible in the photo with estimated portions, nutrition, and the clues needed to look them up.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['is_food', 'items'],
    properties: {
      is_food: { type: 'boolean', description: 'False when the photo contains no food or drink.' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'portion', 'protein_g', 'calories', 'carbs_g', 'fat_g', 'confidence', 'kind', 'grams', 'grams_low', 'grams_high', 'cook_state', 'db_query', 'brand', 'product', 'barcode', 'label', 'servings'],
          properties: {
            name: { type: 'string', description: 'Short food name, e.g. "Grilled chicken breast".' },
            portion: { type: 'string', description: 'Visible portion, e.g. "1 cup cooked, about 160 g".' },
            protein_g: { type: 'number', description: 'Grams of protein in that portion.' },
            calories: { type: 'number', description: 'Kilocalories in that portion.' },
            carbs_g: { type: 'number', description: 'Grams of carbohydrate in that portion.' },
            fat_g: { type: 'number', description: 'Grams of fat in that portion.' },
            confidence: { type: 'number', description: 'How sure you are, from 0 to 1.' },
            kind: { type: 'string', enum: ['packaged', 'whole_food', 'mixed_dish', 'drink'] },
            grams: { ...NULLABLE_NUMBER, description: 'Best guess of the edible weight in grams (ml for drinks).' },
            grams_low: { ...NULLABLE_NUMBER, description: 'Realistic lowest weight.' },
            grams_high: { ...NULLABLE_NUMBER, description: 'Realistic highest weight.' },
            cook_state: { type: 'string', enum: ['raw', 'cooked', 'not_applicable', 'unknown'] },
            db_query: { type: 'string', description: 'Generic database name with preparation, e.g. "salmon fillet baked".' },
            brand: { ...NULLABLE_STRING, description: 'Brand printed on the package, or null.' },
            product: { ...NULLABLE_STRING, description: 'Product name printed on the package, or null.' },
            barcode: { ...NULLABLE_STRING, description: 'Barcode digits only if clearly readable, else null.' },
            label: {
              description: 'Per-serving numbers from a readable nutrition facts label, or null.',
              anyOf: [
                { type: 'null' },
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['serving_text', 'serving_size_g', 'protein_g', 'calories', 'carbs_g', 'fat_g'],
                  properties: {
                    serving_text: { type: 'string', description: 'Serving as printed, e.g. "1 scoop (31 g)".' },
                    serving_size_g: NULLABLE_NUMBER,
                    protein_g: NULLABLE_NUMBER,
                    calories: NULLABLE_NUMBER,
                    carbs_g: NULLABLE_NUMBER,
                    fat_g: NULLABLE_NUMBER,
                  },
                },
              ],
            },
            servings: { ...NULLABLE_NUMBER, description: 'Label servings shown or eaten, e.g. 2 for two bars.' },
          },
        },
      },
    },
  },
};

type AnthropicOutcome = { ok: true; message: unknown } | { ok: false; status: number };

async function callAnthropic(apiKey: string, imageBase64: string, mediaType: string): Promise<AnthropicOutcome> {
  const model = Deno.env.get('ANTHROPIC_MODEL') || DEFAULT_MODEL;
  const useFallbacks = FALLBACK_MODELS.has(model);

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': ANTHROPIC_VERSION,
  };
  if (useFallbacks) headers['anthropic-beta'] = FALLBACK_BETA;

  const body = JSON.stringify({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    // A quick visual estimate: keep the model's thinking short so the user is not left waiting.
    output_config: { effort: 'low' },
    tools: [TOOL],
    // Current models reject a forced tool choice, so the single strict tool is
    // requested via the system prompt and at most one call is allowed.
    tool_choice: { type: 'auto', disable_parallel_tool_use: true },
    ...(useFallbacks ? { fallbacks: 'default' } : {}),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: 'What food is in this photo, and how much protein? Report it with the tool.' },
        ],
      },
    ],
  });

  // One retry for rate limits / overload / transient upstream errors.
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(ANTHROPIC_URL, { method: 'POST', headers, body, signal: controller.signal });
      if (res.ok) return { ok: true, message: await res.json() };
      await res.body?.cancel();
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === 1) return { ok: false, status: res.status };
    } catch {
      if (attempt === 1) return { ok: false, status: 0 };
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return { ok: false, status: 0 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey || !apiKey) {
    console.error('analyze-food: missing configuration');
    return json({ error: 'server' }, 500);
  }

  // 1. Who is calling? Signed-in, non-anonymous users only.
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user || user.is_anonymous) return json({ error: 'unauthorized' }, 401);

  // 2. Allowance, enforced here so the app cannot be talked round it.
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('is_premium, photo_scans_used')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('analyze-food: profile read failed');
    return json({ error: 'server' }, 500);
  }
  const isPremium = profile?.is_premium === true;
  const used = typeof profile?.photo_scans_used === 'number' ? profile.photo_scans_used : 0;
  if (!isPremium && used >= FREE_PHOTO_SCANS) return json({ error: 'limit' }, 402);

  // 3. Validate the upload before spending anything on it.
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BASE64_CHARS + 1024) return json({ error: 'too_large' }, 413);
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const { image_base64: rawImage, media_type: mediaType } = (payload ?? {}) as { image_base64?: unknown; media_type?: unknown };
  if (typeof rawImage !== 'string' || typeof mediaType !== 'string' || !MEDIA_TYPES.has(mediaType)) {
    return json({ error: 'bad_request' }, 400);
  }
  const imageBase64 = rawImage.replace(/^data:[^;]+;base64,/, '');
  if (imageBase64.length > MAX_BASE64_CHARS) return json({ error: 'too_large' }, 413);
  if (imageBase64.length < 100 || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) return json({ error: 'bad_request' }, 400);

  // 4. Ask Claude.
  const outcome = await callAnthropic(apiKey, imageBase64, mediaType);
  if (!outcome.ok) {
    console.error(`analyze-food: upstream failed (${outcome.status})`);
    return json({ error: 'server' }, 502);
  }
  const parsed = parseAnalysis(outcome.message, TOOL_NAME);
  if (!parsed.ok) {
    if (parsed.error === 'no_food') return json({ error: 'no_food' }, 422);
    console.error('analyze-food: no usable tool call in response');
    return json({ error: 'server' }, 502);
  }

  // 5. Count the scan (successful analyses only).
  const { error: countError } = profile
    ? await admin.from('profiles').update({ photo_scans_used: used + 1 }).eq('id', user.id)
    : await admin.from('profiles').upsert({ id: user.id, photo_scans_used: 1 }, { onConflict: 'id' });
  if (countError) console.error('analyze-food: scan count update failed');

  return json({ items: parsed.items, source: 'photo' });
});
