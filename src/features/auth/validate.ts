/** Pure helpers for the sign-in form. No React Native imports so Jest stays fast. */

export const EMAIL_CODE_LENGTH = 6;

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** Deliberately loose: something@something.tld. The server is the real judge. */
export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(input));
}

/** Keep digits only, capped at the code length (handles pasted "123 456"). */
export function normalizeCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, EMAIL_CODE_LENGTH);
}

export function isCompleteCode(input: string): boolean {
  return normalizeCode(input).length === EMAIL_CODE_LENGTH;
}

/** Turn whatever the auth backend threw into one short, human sentence. */
export function friendlyAuthError(err: unknown): string {
  const raw = typeof err === 'string' ? err : err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
  const msg = raw.toLowerCase();
  if (!msg) return 'Something went wrong. Please try again.';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('offline')) return "Can't reach the server. Check your connection and try again.";
  if (msg.includes('expired') || msg.includes('invalid') && (msg.includes('token') || msg.includes('otp') || msg.includes('code'))) return "That code didn't work. Check it, or send a new one.";
  if (msg.includes('rate limit') || msg.includes('security purposes') || msg.includes('too many')) return 'Too many tries. Wait a minute, then try again.';
  if (msg.includes('email') && (msg.includes('invalid') || msg.includes('valid'))) return "That email doesn't look right.";
  if (msg.includes('signups not allowed') || msg.includes('provider is not enabled')) return "This sign-in method isn't switched on yet.";
  return 'Something went wrong. Please try again.';
}
