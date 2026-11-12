import { OUT_OF_SCANS, PROBLEMS, scansLeftLabel, scansLeftSpoken, WORKING } from './copy';

describe('scan copy', () => {
  it('counts free scans in two words', () => {
    expect(scansLeftLabel(3)).toBe('3 left');
    expect(scansLeftLabel(1)).toBe('1 left');
    expect(scansLeftLabel(0)).toBe('0 left');
    expect(scansLeftLabel(-2)).toBe('0 left');
  });

  it('spells the count out for screen readers', () => {
    expect(scansLeftSpoken(1)).toBe('1 free photo scan left');
    expect(scansLeftSpoken(3)).toBe('3 free photo scans left');
  });

  it('keeps every state to one short plain line', () => {
    for (const line of [WORKING, OUT_OF_SCANS, ...Object.values(PROBLEMS)]) {
      expect(line.split(' ').length).toBeLessThanOrEqual(4);
      expect(line).not.toMatch(/[!.…]/);
    }
  });
});
