// Moo: independent second opinion on a barcode from FatSecret Platform. Supabase Edge Function (Deno).
//
// FatSecret "Premier Free" (no cost for start-ups/students after verification)
// is the only free, commercial-use branded database with US barcode lookup that
// is independent of USDA and Open Food Facts. Its terms forbid storing nutrient
// values for more than 24 hours, so the app uses this ONLY to confirm numbers
// it got elsewhere; it never logs FatSecret's values.
//
// POST { barcode: string }          digits (UPC-A, EAN-13, EAN-8, GTIN-14)
// 200  { food: {...} | null }        trimmed food.get record, or null when FatSecret has no match
// 501  { error: 'not_configured' }   FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET not set
// 400  { error: 'bad_request' }      429 { error: 'rate_limited' }   5xx { error: 'server' }
//
// Secrets: FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET. FatSecret filters calls by an
// IP allowlist set in its developer console; Supabase Edge Functions have no fixed
// egress IP, see supabase/README.md. Never logs the barcode or any key.
import { corsHeaders, json } from '../_shared/cors.ts';

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_URL = 'https://platform.fatsecret.com/rest/server.api';
const TIMEOUT_MS = 8_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function token(id: string, secret: string): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${btoa(`${id}:${secret}`)}` },
    body: 'grant_type=client_credentials&scope=basic%20barcode',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown } | null;
  if (typeof body?.access_token !== 'string') return null;
  const ttl = typeof body.expires_in === 'number' ? body.expires_in : 3600;
  cachedToken = { value: body.access_token, expiresAt: Date.now() + ttl * 1000 };
  return cachedToken.value;
}

async function call(bearer: string, params: Record<string, string>): Promise<{ status: number; body: unknown }> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${bearer}` },
    body: new URLSearchParams({ ...params, format: 'json' }).toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

/** FatSecret wants a zero-padded GTIN-13. */
function gtin13(digits: string): string | null {
  if (/^\d{14}$/.test(digits)) return digits.startsWith('0') ? digits.slice(1) : null;
  if (/^\d{8}$|^\d{12,13}$/.test(digits)) return digits.padStart(13, '0');
  return null;
}

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Keeps only what the app compares: names and per-serving macros with metric amounts. */
function trimFood(food: Rec): Rec {
  const servingsRaw = isRec(food.servings) ? food.servings.serving : undefined;
  const servings = (Array.isArray(servingsRaw) ? servingsRaw : servingsRaw ? [servingsRaw] : []).filter(isRec);
  return {
    food_id: food.food_id,
    food_name: food.food_name,
    brand_name: food.brand_name,
    servings: servings.slice(0, 6).map((s) => ({
      serving_description: s.serving_description,
      metric_serving_amount: s.metric_serving_amount,
      metric_serving_unit: s.metric_serving_unit,
      calories: s.calories,
      protein: s.protein,
      carbohydrate: s.carbohydrate,
      fat: s.fat,
    })),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const id = Deno.env.get('FATSECRET_CLIENT_ID');
  const secret = Deno.env.get('FATSECRET_CLIENT_SECRET');
  if (!id || !secret) return json({ error: 'not_configured' }, 501);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const raw = isRec(payload) && typeof payload.barcode === 'string' ? payload.barcode.replace(/[\s-]/g, '') : '';
  const barcode = gtin13(raw);
  if (!barcode) return json({ error: 'bad_request' }, 400);

  try {
    const bearer = await token(id, secret);
    if (!bearer) {
      console.error('food-verify: token request failed');
      return json({ error: 'server' }, 502);
    }
    const found = await call(bearer, { method: 'food.find_id_for_barcode', barcode });
    if (found.status === 429) return json({ error: 'rate_limited' }, 429);
    const foodId = isRec(found.body) && isRec(found.body.food_id) ? String(found.body.food_id.value ?? '') : '';
    // FatSecret answers "not found" with food_id 0 (or an error object for an unknown barcode).
    if (!foodId || foodId === '0') return json({ food: null }, 200);
    const got = await call(bearer, { method: 'food.get.v4', food_id: foodId });
    if (got.status === 429) return json({ error: 'rate_limited' }, 429);
    const food = isRec(got.body) && isRec(got.body.food) ? trimFood(got.body.food) : null;
    return json({ food }, 200);
  } catch {
    console.error('food-verify: upstream unreachable');
    return json({ error: 'server' }, 502);
  }
});
