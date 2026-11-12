import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CreatineSettings, Goals, OnboardingAnswers, Units } from '../types';

/**
 * Small, device-local profile state: onboarding answers, goals, preferences.
 * Persisted with AsyncStorage (works on iOS and web). Food/creatine logs live
 * in src/features/log, not here.
 */
export interface ProfileState {
  hydrated: boolean;
  onboardingComplete: boolean;
  /** Route name of the last onboarding step reached, to resume mid-flow. */
  onboardingStep: string | null;
  answers: OnboardingAnswers;
  goals: Goals | null;
  units: Units;
  creatine: CreatineSettings;
  notificationsAsked: boolean;
  mealReminders: boolean;

  setAnswers: (patch: Partial<OnboardingAnswers>) => void;
  setOnboardingStep: (step: string | null) => void;
  setGoals: (goals: Goals) => void;
  setUnits: (units: Units) => void;
  setCreatine: (patch: Partial<CreatineSettings>) => void;
  setNotificationsAsked: (asked: boolean) => void;
  setMealReminders: (on: boolean) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
}

const initial = {
  onboardingComplete: false,
  onboardingStep: null,
  answers: {} as OnboardingAnswers,
  goals: null as Goals | null,
  units: 'imperial' as Units,
  creatine: { enabled: false, doseG: 5, reminderTime: null } as CreatineSettings,
  notificationsAsked: false,
  mealReminders: false,
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      hydrated: false,
      ...initial,
      setAnswers: (patch) => set((s) => ({ answers: { ...s.answers, ...patch } })),
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
      setGoals: (goals) => set({ goals }),
      setUnits: (units) => set({ units }),
      setCreatine: (patch) => set((s) => ({ creatine: { ...s.creatine, ...patch } })),
      setNotificationsAsked: (notificationsAsked) => set({ notificationsAsked }),
      setMealReminders: (mealReminders) => set({ mealReminders }),
      completeOnboarding: () => set({ onboardingComplete: true, onboardingStep: null }),
      resetProfile: () => set({ ...initial }),
    }),
    {
      name: 'moo.profile.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useProfile.setState({ hydrated: true });
      },
    },
  ),
);
