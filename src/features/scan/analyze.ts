/** Photo → nutrition estimate. Real path: Supabase Edge Function `analyze-food`; otherwise a flagged demo result. */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { getSupabase } from '../../lib/supabase';
import type { ScanResult } from '../../types';
import { MOCK_DELAY_MS, mockItems } from './mock';
import { sanitizeItems } from './sanitize';

export type ScanErrorCode = 'no_food' | 'offline' | 'limit' | 'unauthorized' | 'server';

export class ScanError extends Error {
  constructor(public readonly code: ScanErrorCode) {
    super(code);
    this.name = 'ScanError';
  }
}

/** ScanResult plus a flag the UI must surface as "Demo result". */
export interface PhotoScanResult extends ScanResult {
  mock: boolean;
}

export const MAX_EDGE_PX = 1024;
export const JPEG_QUALITY = 0.7;

/** Target size so the longest edge is at most `max`; null when no resize is needed. */
export function fitWithin(width: number, height: number, max: number = MAX_EDGE_PX): { width: number; height: number } | null {
  if (!(width > 0) || !(height > 0)) return null;
  const longest = Math.max(width, height);
  if (longest <= max) return null;
  const k = max / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

export function isMockScan(): boolean {
  return process.env.EXPO_PUBLIC_MOCK_SCAN === '1' || getSupabase() === null;
}

export async function downscaleToBase64(uri: string): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const target = fitWithin(original.width, original.height);
  const image = target ? await ImageManipulator.manipulate(uri).resize(target).renderAsync() : original;
  const saved = await image.saveAsync({ base64: true, compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  if (!saved.base64) throw new Error('no base64 output');
  return { base64: saved.base64, mediaType: 'image/jpeg' };
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Map whatever the function call threw/returned to a typed error code. */
export function codeFromFailure(status: number | null, body: unknown): ScanErrorCode {
  const tag = typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined;
  if (tag === 'no_food' || tag === 'limit' || tag === 'unauthorized') return tag;
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 402) return 'limit';
  return status === null ? 'offline' : 'server';
}

export async function analyzePhoto(uri: string): Promise<PhotoScanResult> {
  if (isMockScan()) {
    // The picture is not needed for the demo, so a failed downscale must not block it.
    const seed = await downscaleToBase64(uri).then((r) => String(r.base64.length), () => 'moo');
    await wait(MOCK_DELAY_MS);
    return { items: mockItems(seed), source: 'photo', mock: true };
  }

  const supabase = getSupabase();
  if (!supabase) throw new ScanError('server');
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new ScanError('unauthorized');

  let image: { base64: string; mediaType: 'image/jpeg' };
  try {
    image = await downscaleToBase64(uri);
  } catch {
    throw new ScanError('server');
  }

  const { data, error } = await supabase.functions.invoke('analyze-food', {
    body: { image_base64: image.base64, media_type: image.mediaType },
  });

  if (error) {
    // FunctionsHttpError carries the Response in `context`; fetch/relay failures do not.
    const ctx: unknown = (error as { context?: unknown }).context;
    if (ctx && typeof ctx === 'object' && typeof (ctx as Response).status === 'number' && typeof (ctx as Response).json === 'function') {
      const res = ctx as Response;
      const body: unknown = await res.json().catch(() => null);
      throw new ScanError(codeFromFailure(res.status, body));
    }
    throw new ScanError('offline');
  }

  if (data && typeof data === 'object' && 'error' in data) throw new ScanError(codeFromFailure(200, data));
  const items = sanitizeItems((data as { items?: unknown } | null)?.items);
  if (items.length === 0) throw new ScanError('no_food');
  return { items, source: 'photo', mock: false };
}
