/**
 * The one entry point the app uses for food data. Chains the free sources:
 *
 *   barcode → Open Food Facts ∥ USDA Branded (GTIN match), cross-checked
 *   text    → USDA (generic + branded) ∥ Open Food Facts, merged and ranked
 *   name    → best single match, for turning a photo guess like
 *             "Quest cookies & cream protein bar" into real label numbers
 *
 * Network calls are injectable (`FoodDeps`) so the logic is unit tested
 * without the network. Results are cached in memory for the session.
 */
import { Platform } from 'react-native';

import { getSupabase } from '../../lib/supabase';
import { mapOffProductResponse, mapOffSearch, OFF_USER_AGENT, offProductUrl, offSearchUrl } from './openFoodFacts';
import { normalizeCode } from './nutrients';
import { rankFoods, scoreFood } from './rank';
import { checkAll, crossCheck } from './verify';
import { FoodLookupError, type FoodItem } from './types';
import { ALL_TYPES, GENERIC_TYPES, mapUsdaSearch, pickBarcodeMatch, USDA_SEARCH_URL, usdaSearchBody, type UsdaSearchParams } from './usda';

export type BarcodeResult =
  | { status: 'found'; food: FoodItem }
  | { status: 'not_found' }
  /** A product exists but no source has usable numbers for it. */
  | { status: 'no_nutrition'; name: string };

export interface FoodDeps {
  fetch: typeof fetch;
  /** Raw USDA search JSON for a request body. Defaults to the Edge Function, or DEMO_KEY without Supabase. */
  usdaSearch: (body: ReturnType<typeof usdaSearchBody>) => Promise<unknown>;
  now: () => number;
}

/** Open Food Facts allows 10 searches per minute per IP; stay under it. */
export const OFF_SEARCHES_PER_MINUTE = 8;
const CACHE_MAX = 200;

function offInit(): RequestInit | undefined {
  // Browsers own the User-Agent header, so only native sets it.
  return Platform.OS === 'web' ? undefined : { headers: { 'User-Agent': OFF_USER_AGENT } };
}

async function getJson(f: typeof fetch, url: string, init?: RequestInit): Promise<{ status: number; json: unknown }> {
  let res: Response;
  try {
    res = await f(url, init);
  } catch {
    throw new FoodLookupError('offline');
  }
  if (res.status === 429) throw new FoodLookupError('rate_limited');
  if (res.status === 404) return { status: 404, json: null };
  if (!res.ok) throw new FoodLookupError('server');
  try {
    return { status: res.status, json: await res.json() };
  } catch {
    throw new FoodLookupError('server');
  }
}

/** Default USDA transport: `food-search` Edge Function when Supabase is configured, else the public DEMO_KEY. */
export async function defaultUsdaSearch(body: ReturnType<typeof usdaSearchBody>, f: typeof fetch = fetch): Promise<unknown> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('food-search', { body });
    if (error) {
      const status = (error as { context?: { status?: unknown } }).context?.status;
      throw new FoodLookupError(status === 429 ? 'rate_limited' : typeof status === 'number' ? 'server' : 'offline');
    }
    return data;
  }
  const { json } = await getJson(f, `${USDA_SEARCH_URL}?api_key=DEMO_KEY`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return json;
}

export function createFoodService(partial: Partial<FoodDeps> = {}) {
  const deps: FoodDeps = {
    // Late-bound so tests that replace global fetch, and polyfills, are honoured.
    fetch: partial.fetch ?? (((input: string, init?: RequestInit) => fetch(input, init)) as typeof fetch),
    usdaSearch: partial.usdaSearch ?? ((b) => defaultUsdaSearch(b, deps.fetch)),
    now: partial.now ?? Date.now,
  };
  const barcodeCache = new Map<string, BarcodeResult>();
  const searchCache = new Map<string, FoodItem[]>();
  let offSearchTimes: number[] = [];

  function remember<V>(m: Map<string, V>, k: string, v: V): V {
    if (m.size >= CACHE_MAX) m.delete(m.keys().next().value as string);
    m.set(k, v);
    return v;
  }

  function offSearchAllowed(): boolean {
    const t = deps.now();
    offSearchTimes = offSearchTimes.filter((x) => t - x < 60_000);
    if (offSearchTimes.length >= OFF_SEARCHES_PER_MINUTE) return false;
    offSearchTimes.push(t);
    return true;
  }

  async function usda(params: UsdaSearchParams): Promise<FoodItem[]> {
    return mapUsdaSearch(await deps.usdaSearch(usdaSearchBody(params)));
  }

  /**
   * Barcode → food. Asks Open Food Facts and USDA Branded (GTIN match) at the
   * same time, then cross-checks them: the result says whether a second source
   * confirmed the numbers. Either source alone is enough to answer.
   */
  async function lookupBarcode(input: string): Promise<BarcodeResult> {
    const code = normalizeCode(input);
    if (!code) throw new FoodLookupError('invalid');
    const cached = barcodeCache.get(code);
    if (cached) return cached;

    const [offRes, usdaRes] = await Promise.allSettled([
      getJson(deps.fetch, offProductUrl(code), offInit()).then(({ json }) => mapOffProductResponse(json, code)),
      usda({ query: code, dataTypes: ['Branded'], pageSize: 5 }).then((foods) => pickBarcodeMatch(foods, code)),
    ]);

    const candidates: FoodItem[] = [];
    if (offRes.status === 'fulfilled' && offRes.value.status === 'found') candidates.push(offRes.value.food);
    if (usdaRes.status === 'fulfilled' && usdaRes.value) candidates.push(usdaRes.value);
    const best = crossCheck(candidates);
    if (best) return remember(barcodeCache, code, { status: 'found', food: best });

    if (offRes.status === 'fulfilled' && offRes.value.status === 'no_nutrition') return offRes.value;
    // Nothing found. Only an error if no source answered at all; report the first one so "offline" stays "offline".
    if (offRes.status === 'rejected' && usdaRes.status === 'rejected') {
      const e: unknown = offRes.reason;
      throw e instanceof FoodLookupError ? e : new FoodLookupError('server');
    }
    if (offRes.status === 'rejected') {
      const e: unknown = offRes.reason;
      // USDA answered "no match" but Open Food Facts (the main barcode source) never answered: don't claim "not found".
      throw e instanceof FoodLookupError ? e : new FoodLookupError('server');
    }
    // Cache "not found" only when every source answered; a failed source may know it next time.
    const notFound: BarcodeResult = { status: 'not_found' };
    return usdaRes.status === 'fulfilled' ? remember(barcodeCache, code, notFound) : notFound;
  }

  /**
   * Text search across sources. Partial failures are tolerated: results from
   * whichever source answered are returned; it only throws when all fail.
   */
  async function search(query: string, opts: { limit?: number } = {}): Promise<FoodItem[]> {
    const q = query.trim().replace(/\s+/g, ' ');
    if (q.length < 2) return [];
    const key = q.toLowerCase();
    const cached = searchCache.get(key);
    if (cached) return cached.slice(0, opts.limit ?? 30);

    const tasks: Promise<FoodItem[]>[] = [usda({ query: q, dataTypes: ALL_TYPES, pageSize: 30 })];
    if (offSearchAllowed()) tasks.push(getJson(deps.fetch, offSearchUrl(q), offInit()).then((r) => mapOffSearch(r.json)));
    const settled = await Promise.allSettled(tasks);
    const ok = settled.filter((s): s is PromiseFulfilledResult<FoodItem[]> => s.status === 'fulfilled');
    if (ok.length === 0) {
      const first = settled[0] as PromiseRejectedResult;
      throw first.reason instanceof FoodLookupError ? first.reason : new FoodLookupError('server');
    }
    const ranked = rankFoods(checkAll(ok.flatMap((s) => s.value)), q, 50);
    return remember(searchCache, key, ranked).slice(0, opts.limit ?? 30);
  }

  /**
   * Best database match for a food name (e.g. from a photo of a package).
   * Returns null unless the match covers the important words, so a vague
   * guess is never silently swapped for the wrong product.
   */
  async function bestMatch(name: string, opts: { packaged?: boolean } = {}): Promise<FoodItem | null> {
    const q = name.trim();
    if (q.length < 3) return null;
    const foods = mapUsdaSearch(await deps.usdaSearch(usdaSearchBody({ query: q, dataTypes: opts.packaged ? ['Branded'] : GENERIC_TYPES, pageSize: 10 })));
    const [top] = rankFoods(foods, q, 1);
    // Every query word must match (10 + 3 bonus + quality); a partial match scores well under 12.
    return top && scoreFood(top, q) >= 12 ? top : null;
  }

  return { lookupBarcode, search, bestMatch, clearCache: () => (barcodeCache.clear(), searchCache.clear()) };
}

export type FoodService = ReturnType<typeof createFoodService>;

let shared: FoodService | null = null;
/** App-wide instance (shared cache and rate limiter). */
export function foods(): FoodService {
  if (!shared) shared = createFoodService();
  return shared;
}
