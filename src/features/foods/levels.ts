/** Short words and maths for showing reliability on the result sheet. Pure. */
import type { ReliabilityLevel, ScannedItem } from '../../types';

/** One word or two, to fit a pill. */
export const LEVEL_LABEL: Record<ReliabilityLevel, string> = {
  verified: 'Verified',
  label: 'Brand data',
  reference: 'USDA data',
  community: 'Community data',
  label_photo: 'From label',
  estimate: 'Estimate',
};

/** Read out by screen readers. */
export const LEVEL_SPOKEN: Record<ReliabilityLevel, string> = {
  verified: 'Verified: two independent food databases agree.',
  label: 'From the manufacturer label data in the USDA database.',
  reference: 'From USDA lab data for this food.',
  community: 'From Open Food Facts, entered by volunteers. Check it against the label.',
  label_photo: 'Read from the nutrition label in your photo.',
  estimate: 'Estimated from your photo. Check the portion before you add it.',
};

const ORDER: ReliabilityLevel[] = ['verified', 'label', 'reference', 'community', 'label_photo', 'estimate'];

/** The weakest level among the items: a meal is only as sure as its least sure part. */
export function overallLevel(items: Pick<ScannedItem, 'reliability'>[]): ReliabilityLevel | null {
  let worst = -1;
  for (const i of items) if (i.reliability) worst = Math.max(worst, ORDER.indexOf(i.reliability));
  return worst >= 0 ? ORDER[worst]! : null;
}

/** True when the level means "check this". */
export function needsCheck(level: ReliabilityLevel | null): boolean {
  return level === 'estimate' || level === 'community';
}

/** Total protein range for items scaled by servings; null when no item has a range wider than its value. */
export function totalProteinRange(items: (Pick<ScannedItem, 'proteinG' | 'proteinRange'> & { servings: number })[]): { lowG: number; highG: number } | null {
  let low = 0;
  let high = 0;
  let any = false;
  for (const i of items) {
    const r = i.proteinRange;
    if (r && (r.lowG < i.proteinG || r.highG > i.proteinG)) any = true;
    low += (r?.lowG ?? i.proteinG) * i.servings;
    high += (r?.highG ?? i.proteinG) * i.servings;
  }
  return any ? { lowG: Math.round(low), highG: Math.round(high) } : null;
}

/** "38–56 g" */
export function formatRange(r: { lowG: number; highG: number }): string {
  return `${Math.round(r.lowG)}–${Math.round(r.highG)} g`;
}
