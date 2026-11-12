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

  it('sex and birth year share one step', () => {
    expect(nextStep('enough-protein')).toBe('about');
    expect(nextStep('about')).toBe('body');
    expect(prevStep('body')).toBe('about');
    expect(getSteps()).not.toContain('sex');
    expect(getSteps()).not.toContain('birth-year');
  });

  it('creatine "no" goes straight to notifications', () => {
    const ctx = { mainGoal: 'maintain', creatineChoice: 'no' } as const;
    expect(nextStep('creatine', ctx)).toBe('notifications');
    expect(prevStep('notifications', ctx)).toBe('creatine');
    expect(getSteps(ctx)).not.toContain('creatine-no');
  });

  it('creatine "yes" and "thinking" set dose and reminder on one step', () => {
    for (const creatineChoice of ['yes', 'thinking'] as const) {
      const ctx = { mainGoal: 'maintain', creatineChoice } as const;
      expect(nextStep('creatine', ctx)).toBe('creatine-setup');
      expect(nextStep('creatine-setup', ctx)).toBe('notifications');
      expect(prevStep('notifications', ctx)).toBe('creatine-setup');
    }
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
    expect(stepProgress('goal', ctx)).toEqual({ value: 1 / 10, index: 1, total: 10 });
    expect(stepProgress('goal', { mainGoal: 'lose_fat', creatineChoice: 'yes' })?.total).toBe(13);
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
    expect(resumeStep('creatine-setup', { creatineChoice: 'no' })).toBeNull();
    expect(resumeStep('creatine-setup', { creatineChoice: 'thinking' })).toBe('creatine-setup');
  });

  it('resumes steps saved before screens were merged', () => {
    expect(resumeStep('sex')).toBe('about');
    expect(resumeStep('birth-year')).toBe('about');
    expect(resumeStep('creatine-no', { creatineChoice: 'no' })).toBe('creatine');
    expect(resumeStep('creatine-dose', { creatineChoice: 'yes' })).toBe('creatine-setup');
    expect(resumeStep('creatine-reminder', { creatineChoice: 'yes' })).toBe('creatine-setup');
    expect(resumeStep('creatine-reminder', { creatineChoice: 'no' })).toBeNull();
    expect(resumeStep('toString')).toBeNull();
  });

  it('maps steps to routes', () => {
    expect(stepHref('index')).toBe('/');
    expect(stepHref('gym-days')).toBe('/gym-days');
  });
});
