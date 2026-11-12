import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useProfile, type ProfileState } from '../../state/profile';
import { nextStep, prevStep, stepHref, stepProgress, type StepContext, type StepName } from './steps';

export function stepContextOf(s: Pick<ProfileState, 'answers'>): StepContext {
  return { mainGoal: s.answers.mainGoal, creatineChoice: s.answers.creatineChoice };
}

export const hrefOf = (step: StepName): Href => stepHref(step) as Href;

/**
 * Next/back/progress for one onboarding screen. Also records the screen as
 * the current step whenever it gains focus, so a quit mid-flow resumes here.
 */
export function useOnboardingNav(step: StepName, options: { record?: boolean } = {}) {
  const router = useRouter();
  const record = options.record !== false;
  const mainGoal = useProfile((s) => s.answers.mainGoal);
  const creatineChoice = useProfile((s) => s.answers.creatineChoice);

  useFocusEffect(
    useCallback(() => {
      if (record) useProfile.getState().setOnboardingStep(step);
    }, [record, step]),
  );

  const progress = useMemo(() => stepProgress(step, { mainGoal, creatineChoice }), [step, mainGoal, creatineChoice]);
  const hasBack = useMemo(() => prevStep(step, { mainGoal, creatineChoice }) !== null, [step, mainGoal, creatineChoice]);

  /** Reads the store at call time, so answers saved just before are honoured. */
  const next = useCallback(
    (mode: 'push' | 'replace' = 'push') => {
      const target = nextStep(step, stepContextOf(useProfile.getState()));
      if (!target) return;
      if (mode === 'replace') router.replace(hrefOf(target));
      else router.push(hrefOf(target));
    },
    [router, step],
  );

  const back = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    // Resumed mid-flow: there is no history, so rebuild it one step at a time.
    const target = prevStep(step, stepContextOf(useProfile.getState()));
    if (target) router.replace(hrefOf(target));
  }, [router, step]);

  const goTo = useCallback((target: StepName) => router.push(hrefOf(target)), [router]);

  return { next, back, goTo, progress, hasBack };
}
