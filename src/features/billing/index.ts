/**
 * Billing contract. BASE STUB: everyone is on the free tier with a local scan
 * counter. The accounts/paywall work wires RevenueCat behind these exports.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const FREE_PHOTO_SCANS = 3;

export interface BillingState {
  isPremium: boolean;
  photoScansUsed: number;
  setPremium: (v: boolean) => void;
  recordPhotoScan: () => void;
}

export const useBilling = create<BillingState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      photoScansUsed: 0,
      setPremium: (isPremium) => set({ isPremium }),
      recordPhotoScan: () => set({ photoScansUsed: get().photoScansUsed + 1 }),
    }),
    { name: 'moo.billing.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function canPhotoScan(s: Pick<BillingState, 'isPremium' | 'photoScansUsed'>): boolean {
  return s.isPremium || s.photoScansUsed < FREE_PHOTO_SCANS;
}

/** Open the paywall modal route. */
export function presentPaywall(reason?: 'scan_limit' | 'history' | 'weekly' | 'onboarding'): void {
  router.push({ pathname: '/paywall', params: reason ? { reason } : {} });
}
