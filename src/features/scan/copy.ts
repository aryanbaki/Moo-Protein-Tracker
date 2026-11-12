/** Words for the scan flow, kept together so tone stays consistent. */
export const CHEW_LINES = ['Chewing it over…', 'Sniffing the plate…', 'Counting the protein…', 'Consulting the herd…', 'Mooving the decimals…'];
export const BARCODE_LINES = ['Reading the label…', 'Checking the pantry…', 'Squinting at the stripes…'];

export type ProblemCode = 'no_food' | 'offline' | 'server' | 'unauthorized' | 'not_found' | 'no_nutrition' | 'invalid';

export interface ProblemCopy {
  title: string;
  body: string;
}

export const PROBLEMS: Record<ProblemCode, ProblemCopy> = {
  no_food: { title: "I can't see any food", body: 'Try again with the food in the middle of the frame and a bit more light.' },
  offline: { title: "Can't reach the barn", body: 'You look offline. Check your connection and try again.' },
  server: { title: 'Something went sideways', body: "That didn't work on our end. Give it another go." },
  unauthorized: { title: 'Sign in to scan photos', body: 'Photo scans need a Moo account. Barcodes and typing it in work without one.' },
  not_found: { title: "That one isn't in the book", body: "This barcode isn't in Open Food Facts yet. You can type the numbers in instead." },
  no_nutrition: { title: 'No nutrition on file', body: 'Open Food Facts knows this product but has no numbers for it. You can type them in instead.' },
  invalid: { title: "That doesn't look like a barcode", body: 'Barcodes are 8, 12 or 13 digits. Check the number and try again.' },
};

export function scansLeftLabel(left: number): string {
  if (left <= 0) return 'No free scans left';
  return left === 1 ? '1 free scan left' : `${left} free scans left`;
}
