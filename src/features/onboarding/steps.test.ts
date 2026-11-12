import { getSteps, nextStep, prevStep, resumeStep, stepHref, stepProgress } from './steps';

describe('onboarding steps', () => {
  it('skips target weight and pace for maintain and eat better', () => {
    for (const mainGoal of ['maintain', 'eat_better'] as const) {
      expect(getSteps({ mainGoal })).not.toContain('target-weight');
      expect(getSteps({ mainGoal })).not.toContain('pace');
      expect(nextStep('body', { mainGoal })).toBe('chart');
      expect(prevStep('chart', { mainGoal })).toBe('body');
    }
  });

  it('includes target weight and pace for lose fat and build muscle', () => {
    for (const mainGoal of ['lose_fat', 'build_muscle'] as const) {
      expect(nextStep('body', { mainGoal })).toBe('target-weight');
      expect(nextStep('target-weight', { mainGoal })).toBe('pace');
      expect(nextStep('pace', { mainGoal })).toBe('chart');
    }
  });

  it('creatine "no" goes to the no-pressure screen and then notifications', () => {
    const ctx = { mainGoal: 'maintain', creatineChoice: 'no' } as const;
    expect(nextStep('creatine', ctx)).toBe('creatine-no');
    expect(nextStep('creatine-no', ctx)).toBe('notifications');
    expect(prevStep('notifications', ctx)).toBe('creatine-no');
  });

  it('creatine "yes" goes through dose and reminder', () => {
    const ctx = { mainGoal: 'maintain', creatineChoice: 'yes' } as const;
    expect(nextStep('creatine', ctx)).toBe('creatine-dose');
    expect(nextStep('creatine-dose', ctx)).toBe('creatine-reminder');
    expect(nextStep('creatine-reminder', ctx)).toBe('notifications');
  });

  it('"thinking" skips the reminder when they decide later', () => {
    const ctx = { creatineChoice: 'thinking', creatineEnabled: false } as const;
    expect(nextStep('creatine-dose', ctx)).toBe('notifications');
    expect(nextStep('creatine-dose', { creatineChoice: 'thinking', creatineEnabled: true })).toBe('creatine-reminder');
  });

  it('back never lands on splash or loading', () => {
    expect(prevStep('plan', { creatineChoice: 'no' })).toBe('notifications');
    expect(prevStep('welcome')).toBeNull();
    expect(prevStep('goal')).toBe('welcome');
  });

  it('ends at the plan', () => {
    expect(nextStep('notifications')).toBe('loading');
    expect(nextStep('loading')).toBe('plan');
    expect(nextStep('plan')).toBeNull();
  });

  it('reports progress only on counted steps and reaches 1 at the plan', () => {
    expect(stepProgress('index')).toBeNull();
    expect(stepProgress('welcome')).toBeNull();
    expect(stepProgress('loading')).toBeNull();
    const ctx = { mainGoal: 'maintain', creatineChoice: 'no' } as const;
    expect(stepProgress('goal', ctx)).toEqual({ value: 1 / 12, index: 1, total: 12 });
    expect(stepProgress('plan', ctx)?.value).toBe(1);
    expect(stepProgress('pace', ctx)).toBeNull();
  });

  it('progress increases monotonically along every path', () => {
    for (const mainGoal of ['maintain', 'lose_fat'] as const)
      for (const creatineChoice of ['yes', 'no', 'thinking'] as const) {
        const ctx = { mainGoal, creatineChoice };
        let last = 0;
        for (const s of getSteps(ctx)) {
          const p = stepProgress(s, ctx);
          if (!p) continue;
          expect(p.value).toBeGreaterThan(last);
          last = p.value;
        }
        expect(last).toBe(1);
      }
  });

  it('resumes only into valid steps', () => {
    expect(resumeStep('gym-days')).toBe('gym-days');
    expect(resumeStep(null)).toBeNull();
    expect(resumeStep('nonsense')).toBeNull();
    expect(resumeStep('welcome')).toBeNull();
    expect(resumeStep('index')).toBeNull();
    expect(resumeStep('pace', { mainGoal: 'maintain' })).toBeNull();
    expect(resumeStep('pace', { mainGoal: 'lose_fat' })).toBe('pace');
    expect(resumeStep('plan', { mainGoal: 'maintain' })).toBe('plan');
  });

  it('maps steps to routes', () => {
    expect(stepHref('index')).toBe('/');
    expect(stepHref('gym-days')).toBe('/gym-days');
  });
});
