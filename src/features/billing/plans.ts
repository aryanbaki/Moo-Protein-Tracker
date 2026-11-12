/**
 * Pure plan logic for the paywall: turning store packages into what the screen
 * shows. No React Native or RevenueCat runtime imports, so it is unit-testable.
 * Prices always come from the store; nothing here invents one.
 */

export const PREMIUM_ENTITLEMENT = 'premium';

export type PlanKind = 'yearly' | 'monthly' | 'other';

/** How purchases behave in this build. */
export type BillingMode =
  /** RevenueCat is configured: real offerings, real purchases. */
  | 'live'
  /** No store key, but a dev or web build: sample plans, the button simulates success. */
  | 'preview'
  /** No store key in a production app build: plans shown for layout only, buying is disabled. */
  | 'unavailable';

export interface Plan {
  id: string;
  kind: PlanKind;
  title: string;
  /** Store-formatted price such as "$29.99", or PRICE_PLACEHOLDER when unknown. */
  priceLabel: string;
  /** "per year", "per month" or "". */
  periodLabel: string;
  /** Free-trial length in days when the store offering really has one, else null. */
  trialDays: number | null;
  /** True for the built-in sample plans (no store behind them). */
  isSample: boolean;
}

export const PRICE_PLACEHOLDER = '—';
export const PRICE_PLACEHOLDER_NOTE = 'App Store price';

/** Sample plans for builds without a store key. Prices are deliberately blank. */
export const SAMPLE_PLANS: Plan[] = [
  { id: 'sample_yearly', kind: 'yearly', title: 'Yearly', priceLabel: PRICE_PLACEHOLDER, periodLabel: 'per year', trialDays: 3, isSample: true },
  { id: 'sample_monthly', kind: 'monthly', title: 'Monthly', priceLabel: PRICE_PLACEHOLDER, periodLabel: 'per month', trialDays: null, isSample: true },
];

/** The slice of a RevenueCat package this module reads. */
export interface StorePackageLike {
  identifier: string;
  packageType?: string;
  product: {
    title?: string;
    priceString: string;
    subscriptionPeriod?: string | null;
    introPrice?: { price: number; periodUnit: string; periodNumberOfUnits: number; cycles?: number } | null;
  };
}

export function resolveBillingMode(opts: { hasKey: boolean; platform: string; isDev: boolean }): BillingMode {
  const native = opts.platform === 'ios' || opts.platform === 'android';
  if (opts.hasKey && native) return 'live';
  if (opts.isDev || opts.platform === 'web') return 'preview';
  return 'unavailable';
}

export function planKind(pkg: Pick<StorePackageLike, 'packageType' | 'product'>): PlanKind {
  const type = (pkg.packageType ?? '').toUpperCase();
  const period = (pkg.product.subscriptionPeriod ?? '').toUpperCase();
  if (type === 'ANNUAL' || period === 'P1Y' || period === 'P12M') return 'yearly';
  if (type === 'MONTHLY' || period === 'P1M') return 'monthly';
  return 'other';
}

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** Days of free trial, only when the intro offer is genuinely free. */
export function trialDaysOf(intro: StorePackageLike['product']['introPrice']): number | null {
  if (!intro || intro.price !== 0) return null;
  const perUnit = UNIT_DAYS[intro.periodUnit.toUpperCase()];
  if (!perUnit) return null;
  const days = perUnit * intro.periodNumberOfUnits * Math.max(1, intro.cycles ?? 1);
  return days > 0 ? days : null;
}

export function toPlan(pkg: StorePackageLike): Plan {
  const kind = planKind(pkg);
  return {
    id: pkg.identifier,
    kind,
    title: kind === 'yearly' ? 'Yearly' : kind === 'monthly' ? 'Monthly' : pkg.product.title || 'Premium',
    priceLabel: pkg.product.priceString || PRICE_PLACEHOLDER,
    periodLabel: kind === 'yearly' ? 'per year' : kind === 'monthly' ? 'per month' : '',
    trialDays: trialDaysOf(pkg.product.introPrice),
    isSample: false,
  };
}

const ORDER: Record<PlanKind, number> = { yearly: 0, monthly: 1, other: 2 };

/** Yearly first, then monthly, then anything else, keeping store order within a kind. */
export function sortPlans<T extends { kind: PlanKind }>(plans: T[]): T[] {
  return plans.map((p, i) => ({ p, i })).sort((a, b) => ORDER[a.p.kind] - ORDER[b.p.kind] || a.i - b.i).map((x) => x.p);
}

/** Yearly is preselected; otherwise the first plan. */
export function defaultPlanId(plans: Pick<Plan, 'id' | 'kind'>[]): string | null {
  return (plans.find((p) => p.kind === 'yearly') ?? plans[0])?.id ?? null;
}

export function trialLabel(days: number): string {
  return `${days}-day trial`;
}

/**
 * The one legal line under the button. Always says it renews and can be
 * cancelled. When a trial turns into a known store price, it says that too,
 * because the charge after a trial must not be a surprise.
 */
export function renewalCopy(plan: Plan | null): string {
  const tail = 'Renews automatically. Cancel anytime.';
  if (!plan?.trialDays || plan.priceLabel === PRICE_PLACEHOLDER) return tail;
  const price = `${plan.priceLabel}${plan.periodLabel ? ` ${plan.periodLabel}` : ''}`;
  return `${plan.trialDays} days free, then ${price}. ${tail}`;
}

/** Is the "premium" entitlement active in a RevenueCat CustomerInfo-shaped object? */
export function hasPremium(info: { entitlements?: { active?: Record<string, unknown> } } | null | undefined): boolean {
  return !!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT];
}
