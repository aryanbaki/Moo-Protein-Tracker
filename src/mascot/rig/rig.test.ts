import { ANIMATIONS } from '../animations';
import { SKINS } from '../skins';
import { compile, ease, sample, samplePart, stepAt } from './engine';
import { EASINGS, EYE_KINDS, MOUTH_KINDS, type PartName, TRACK_NAMES } from './types';

describe('engine', () => {
  it('every easing starts at 0 and ends at 1', () => {
    EASINGS.forEach((name, code) => {
      if (name !== 'hold') expect(ease(code, 0)).toBeCloseTo(0, 5);
      expect(ease(code, 1)).toBeCloseTo(1, 5);
    });
  });

  it('interpolates each property on its own and holds outside its keys', () => {
    const c = compile({
      id: 't',
      name: 't',
      category: 'alive',
      loop: false,
      durationMs: 1000,
      restFrame: 0,
      tracks: {
        head: [
          { t: 0.2, rotate: 10, ease: 'linear' },
          { t: 0.6, rotate: 30, y: 0.1, ease: 'linear' },
        ],
      },
      expressions: [{ t: 0.5, eyes: 'wide' }],
    });
    expect(sample(c.tracks.head?.r, 0, 0)).toBe(10);
    expect(sample(c.tracks.head?.r, 0.4, 0)).toBeCloseTo(20);
    expect(sample(c.tracks.head?.r, 1, 0)).toBe(30);
    expect(sample(c.tracks.head?.y, 0.1, 0)).toBe(0.1);
    expect(samplePart(c, ['armL', 'head'], [0.5, 1], 0.4)[0]).toBeCloseTo(20);
    expect(samplePart(c, ['tail'], [1], 0.4)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(stepAt(c.eyes, 0.4, 0)).toBe(0);
    expect(stepAt(c.eyes, 0.5, 0)).toBe(EYE_KINDS.indexOf('wide'));
  });
});

describe('registered animations', () => {
  it('have unique ids', () => {
    expect(new Set(ANIMATIONS.map((a) => a.id)).size).toBe(ANIMATIONS.length);
  });

  it.each(ANIMATIONS.map((a) => [a.id, a] as const))('%s is well formed', (_id, a) => {
    expect(a.durationMs).toBeGreaterThan(0);
    expect(a.restFrame).toBeGreaterThanOrEqual(0);
    expect(a.restFrame).toBeLessThanOrEqual(1);
    for (const [name, keys] of Object.entries(a.tracks ?? {})) {
      expect(TRACK_NAMES).toContain(name);
      for (const k of keys ?? []) {
        expect(k.t).toBeGreaterThanOrEqual(0);
        expect(k.t).toBeLessThanOrEqual(1);
        if (k.ease) expect(EASINGS).toContain(k.ease);
      }
    }
    for (const cue of a.props ?? []) {
      expect(cue.from).toBeGreaterThanOrEqual(0);
      expect(cue.to).toBeLessThanOrEqual(1);
      expect(cue.to).toBeGreaterThan(cue.from);
    }
    if (a.loop) {
      // A loop must end exactly where it starts, on every channel.
      const c = compile(a);
      for (const track of Object.values(c.tracks)) {
        for (const ch of Object.values(track ?? {})) {
          expect(sample(ch, 1, 0)).toBeCloseTo(sample(ch, 0, 0), 4);
        }
      }
    }
  });
});

describe('registered skins', () => {
  it('have unique ids', () => {
    expect(new Set(SKINS.map((s) => s.id)).size).toBe(SKINS.length);
  });

  it.each(SKINS.map((s) => [s.id, s] as const))('%s is complete', (_id, s) => {
    const required: PartName[] = ['body', 'head', 'tail', 'legFL', 'legFR', 'legBL', 'legBR', 'earL', 'earR', 'eyes', 'mouth'];
    for (const name of required) {
      const part = s.parts[name as keyof typeof s.parts];
      expect(part).toBeDefined();
      expect(part?.pivot).toHaveLength(2);
      expect(s.zOrder).toContain(name);
    }
    for (const entry of s.zOrder) {
      if (typeof entry === 'string') expect(s.parts[entry as keyof typeof s.parts]).toBeDefined();
    }
    for (const kind of EYE_KINDS) expect(s.eyes[kind].shapes.length + (s.eyes[kind].pupils?.length ?? 0)).toBeGreaterThan(0);
    for (const kind of MOUTH_KINDS) if (kind !== 'none') expect(s.mouth[kind].length).toBeGreaterThan(0);
    expect(s.silhouette.length).toBeGreaterThan(0);
    expect(s.headSilhouette.length).toBeGreaterThan(0);
    expect(s.fillRange.bottom).toBeGreaterThan(s.fillRange.top);
    for (const shape of Object.values(s.parts).flatMap((p) => p?.shapes ?? [])) {
      if (shape.clip) expect(s.clips?.[shape.clip]).toBeDefined();
    }
  });
});
