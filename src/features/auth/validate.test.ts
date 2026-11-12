import { friendlyAuthError, isCompleteCode, isValidEmail, normalizeCode, normalizeEmail } from './validate';

describe('email', () => {
  it('normalises case and whitespace', () => {
    expect(normalizeEmail('  Moo@Farm.COM ')).toBe('moo@farm.com');
  });
  it('accepts plausible addresses and rejects junk', () => {
    expect(isValidEmail('moo@farm.com')).toBe(true);
    expect(isValidEmail(' a.b+c@d.co ')).toBe(true);
    expect(isValidEmail('moo@farm')).toBe(false);
    expect(isValidEmail('moo farm@x.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('code', () => {
  it('keeps six digits only', () => {
    expect(normalizeCode('123 456')).toBe('123456');
    expect(normalizeCode('12a34')).toBe('1234');
    expect(normalizeCode('1234567890')).toBe('123456');
  });
  it('knows when the code is complete', () => {
    expect(isCompleteCode('12345')).toBe(false);
    expect(isCompleteCode('123-456')).toBe(true);
  });
});

describe('friendlyAuthError', () => {
  it('maps known backend messages', () => {
    expect(friendlyAuthError(new Error('Token has expired or is invalid'))).toMatch(/code didn't work/);
    expect(friendlyAuthError({ message: 'Network request failed' })).toMatch(/connection/);
    expect(friendlyAuthError('Email rate limit exceeded')).toMatch(/Too many/);
    expect(friendlyAuthError({ message: 'For security purposes, you can only request this after 30 seconds.' })).toMatch(/Too many/);
  });
  it('never leaks raw errors', () => {
    expect(friendlyAuthError(new Error('PGRST301 jwt weirdness'))).toBe('Something went wrong. Please try again.');
    expect(friendlyAuthError(undefined)).toBe('Something went wrong. Please try again.');
  });
});
