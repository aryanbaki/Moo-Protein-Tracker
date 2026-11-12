/**
 * Billing: free tier with a local photo-scan counter, premium via RevenueCat.
 *
 * RevenueCat is only touched on iOS/Android when a public SDK key is present
 * (EXPO_PUBLIC_REVENUECAT_IOS_KEY, optionally EXPO_PUBLIC_REVENUECAT_ANDROID_KEY).
 * Otherwise the paywall runs in "preview" mode with sample plans and no prices.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import type PurchasesType from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuth } from '../auth';
import { SAMPLE_PLANS, hasPremium, resolveBillingMode, sortPlans, toPlan, type BillingMode, type Plan } from './plans';

export * from './links';
export {
  PREMIUM_ENTITLEMENT,
  PRICE_PLACEHOLDER,
  PRICE_PLACEHOLDER_NOTE,
  defaultPlanId,
  renewalCopy,
  trialLabel,
  type BillingMode,
  type Plan,
  type PlanKind,
} from './plans';

export const FREE_PHOTO_SCANS = 3;

export type PaywallReason = 'scan_limit' | 'history' | 'weekly' | 'onboarding';

export type PurchaseResult = { ok: true } | { ok: false; cancelled?: boolean; error: string };
export type RestoreResult = { ok: true; restored: boolean } | { ok: false; error: string };

export interface BillingState {
  isPremium: boolean;
  photoScansUsed: number;
  setPremium: (v: boolean) => void;
  recordPhotoScan: () => void;

  /** 'live' = real store; 'preview' = simulated; 'unavailable' = buying disabled. */
  mode: BillingMode;
  /** Plans to show, yearly first. Sample plans (no prices) outside live mode. */
  offerings: Plan[];
  offeringsStatus: 'idle' | 'loading' | 'ready' | 'error';
  loadOfferings: () => Promise<void>;
  purchase: (plan: Plan) => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
}

const apiKey = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : Platform.OS === 'android' ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : undefined;

const mode: BillingMode = resolveBillingMode({ hasKey: !!apiKey, platform: Platform.OS, isDev: __DEV__ });

/** The native SDK, loaded lazily and never on web. Null when it cannot be used. */
function getPurchases(): typeof PurchasesType | null {
  if (mode !== 'live') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('react-native-purchases') as { default: typeof PurchasesType }).default;
  } catch {
    return null;
  }
}

/** Store packages behind the live plans, by plan id. */
const storePackages = new Map<string, PurchasesPackage>();

function errorMessage(err: unknown): string {
  const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message).toLowerCase() : '';
  if (msg.includes('network') || msg.includes('offline')) return "Can't reach the App Store. Check your connection and try again.";
  return "That didn't go through. You have not been charged. Please try again.";
}

export const useBilling = create<BillingState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      photoScansUsed: 0,
      setPremium: (isPremium) => set({ isPremium }),
      recordPhotoScan: () => set({ photoScansUsed: get().photoScansUsed + 1 }),

      mode,
      offerings: mode === 'live' ? [] : SAMPLE_PLANS,
      offeringsStatus: mode === 'live' ? 'idle' : 'ready',

      loadOfferings: async () => {
        const Purchases = getPurchases();
        if (!Purchases) return;
        if (get().offeringsStatus === 'loading') return;
        set({ offeringsStatus: 'loading' });
        try {
          const res = await Purchases.getOfferings();
          const pkgs = res.current?.availablePackages ?? [];
          storePackages.clear();
          for (const p of pkgs) storePackages.set(p.identifier, p);
          set({ offerings: sortPlans(pkgs.map(toPlan)), offeringsStatus: pkgs.length ? 'ready' : 'error' });
        } catch {
          set({ offeringsStatus: 'error' });
        }
      },

      purchase: async (plan) => {
        if (mode === 'preview') {
          // Dev or web build without a store: pretend it worked. Nothing is charged.
          set({ isPremium: true });
          return { ok: true };
        }
        const Purchases = getPurchases();
        const pkg = storePackages.get(plan.id);
        if (!Purchases || !pkg) return { ok: false, error: "Purchases aren't set up in this build yet." };
        try {
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          const premium = hasPremium(customerInfo);
          set({ isPremium: premium });
          return premium ? { ok: true } : { ok: false, error: 'The purchase finished but premium is not active yet. Try Restore purchases in a moment.' };
        } catch (err) {
          if (err && typeof err === 'object' && 'userCancelled' in err && (err as { userCancelled?: boolean }).userCancelled) {
            return { ok: false, cancelled: true, error: '' };
          }
          return { ok: false, error: errorMessage(err) };
        }
      },

      restore: async () => {
        if (mode === 'preview') return { ok: true, restored: get().isPremium };
        const Purchases = getPurchases();
        if (!Purchases) return { ok: false, error: "Purchases aren't set up in this build yet." };
        try {
          const premium = hasPremium(await Purchases.restorePurchases());
          set({ isPremium: premium });
          return { ok: true, restored: premium };
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },
    }),
    {
      name: 'moo.billing.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the entitlement cache and the scan counter are saved; plans come from the store each launch.
      partialize: ({ isPremium, photoScansUsed }) => ({ isPremium, photoScansUsed }),
    },
  ),
);

export function canPhotoScan(s: Pick<BillingState, 'isPremium' | 'photoScansUsed'>): boolean {
  return s.isPremium || s.photoScansUsed < FREE_PHOTO_SCANS;
}

/** Open the paywall modal route. */
export function presentPaywall(reason?: PaywallReason): void {
  router.push({ pathname: '/paywall', params: reason ? { reason } : {} });
}

let initPromise: Promise<void> | null = null;

/**
 * Configure RevenueCat (when a key exists), keep `isPremium` in step with the
 * "premium" entitlement, tie purchases to the signed-in account and load plans.
 * Safe to call more than once, and a no-op in preview builds.
 */
export function initBilling(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const Purchases = getPurchases();
    if (!Purchases || !apiKey) return;
    try {
      Purchases.configure({ apiKey, appUserID: useAuth.getState().user?.id ?? null });
      const apply = (info: CustomerInfo) => useBilling.setState({ isPremium: hasPremium(info) });
      Purchases.addCustomerInfoUpdateListener(apply);

      let linkedUser = useAuth.getState().user?.id ?? null;
      useAuth.subscribe((s) => {
        const next = s.user?.id ?? null;
        if (next === linkedUser) return;
        linkedUser = next;
        // logOut rejects for an already-anonymous customer; that is fine.
        (next ? Purchases.logIn(next).then((r) => r.customerInfo) : Purchases.logOut()).then(apply).catch(() => {});
      });

      apply(await Purchases.getCustomerInfo());
    } catch {
      // Keep the cached entitlement; the listener or the next launch will correct it.
    }
    await useBilling.getState().loadOfferings();
  })();
  return initPromise;
}
