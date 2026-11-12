/** Barcode lookup against Open Food Facts. Always free; no account needed. */
import { Platform } from 'react-native';

import type { ScanResult } from '../../types';
import { clampNumber } from './sanitize';

export type BarcodeLookup =
  | { status: 'found'; result: ScanResult }
  | { status: 'not_found' }
  /** Product exists but has no usable nutrition numbers. */
  | { status: 'no_nutrition'; name: string };

export type BarcodeErrorCode = 'invalid' | 'offline' | 'server';

export class BarcodeError extends Error {
  constructor(public readonly code: BarcodeErrorCode) {
    super(code);
    this.name = 'BarcodeError';
  }
}

const FIELDS = 'product_name,brands,nutriments,serving_size,serving_quantity';
/** Generic client name; deliberately carries no user or device details. */
const USER_AGENT = 'ProteinTrackerApp/1.0 (Expo)';
const KJ_PER_KCAL = 4.184;

/** Digits only; EAN-8, UPC-E (8), UPC-A (12), EAN-13 or GTIN-14. */
export function normalizeBarcode(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '');
  return /^\d{8}$|^\d{12,14}$/.test(digits) ? digits : null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function readBasis(n: Record<string, unknown>, suffix: '_serving' | '_100g') {
  const kcal = num(n[`energy-kcal${suffix}`]);
  const kj = num(n[`energy-kj${suffix}`]) ?? num(n[`energy${suffix}`]);
  return {
    protein: num(n[`proteins${suffix}`]),
    calories: kcal ?? (kj !== null ? kj / KJ_PER_KCAL : null),
    carbs: num(n[`carbohydrates${suffix}`]),
    fat: num(n[`fat${suffix}`]),
  };
}

/** Pure mapping from an Open Food Facts v2 product response to a scan result. */
export function mapOpenFoodFactsProduct(json: unknown): BarcodeLookup {
  if (!isRecord(json) || !isRecord(json.product) || json.status === 0) return { status: 'not_found' };
  const p = json.product;
  const productName = str(p.product_name);
  const brand = str(p.brands).split(',')[0]?.trim() ?? '';
  const name = (brand && productName && !productName.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${productName}` : productName || brand || 'Scanned product').slice(0, 80);

  const nutriments = isRecord(p.nutriments) ? p.nutriments : {};
  const servingSize = str(p.serving_size);
  const serving = readBasis(nutriments, '_serving');
  const per100 = readBasis(nutriments, '_100g');

  // Per-serving only when the label gives a serving and at least protein or energy for it.
  const useServing = !!servingSize && (serving.protein !== null || serving.calories !== null);
  const basis = useServing ? serving : per100;
  if (basis.protein === null && basis.calories === null && basis.carbs === null && basis.fat === null) {
    return { status: 'no_nutrition', name };
  }

  return {
    status: 'found',
    result: {
      source: 'barcode',
      items: [
        {
          name,
          portion: useServing ? servingSize.slice(0, 60) : '100 g',
          proteinG: round1(clampNumber(basis.protein, 0, 500)),
          calories: Math.round(clampNumber(basis.calories, 0, 5000)),
          carbsG: round1(clampNumber(basis.carbs, 0, 500)),
          fatG: round1(clampNumber(basis.fat, 0, 500)),
          // Label data, but community-entered: high, not certain.
          confidence: 0.9,
        },
      ],
    },
  };
}

export async function lookupBarcode(code: string, fetchImpl: typeof fetch = fetch): Promise<BarcodeLookup> {
  const normalized = normalizeBarcode(code);
  if (!normalized) throw new BarcodeError('invalid');
  const url = `https://world.openfoodfacts.org/api/v2/product/${normalized}.json?fields=${FIELDS}`;
  let res: Response;
  try {
    // Browsers own the User-Agent header, so only native sets it.
    res = await fetchImpl(url, Platform.OS === 'web' ? undefined : { headers: { 'User-Agent': USER_AGENT } });
  } catch {
    throw new BarcodeError('offline');
  }
  if (res.status === 404) return { status: 'not_found' };
  if (!res.ok) throw new BarcodeError('server');
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new BarcodeError('server');
  }
  return mapOpenFoodFactsProduct(json);
}
