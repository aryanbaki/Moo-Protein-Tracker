import {
  PRICE_PLACEHOLDER,
  SAMPLE_PLANS,
  defaultPlanId,
  hasPremium,
  planKind,
  renewalCopy,
  resolveBillingMode,
  sortPlans,
  toPlan,
  trialDaysOf,
  trialLabel,
  type StorePackageLike,
} from './plans';

const yearly: StorePackageLike = {
  identifier: '$rc_annual',
  packageType: 'ANNUAL',
  product: { title: 'Moo Premium (Yearly)', priceString: '$29.99', subscriptionPeriod: 'P1Y', introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3, cycles: 1 } },
};
const monthly: StorePackageLike = {
  identifier: '$rc_monthly',
  packageType: 'MONTHLY',
  product: { title: 'Moo Premium (Monthly)', priceString: '$4.99', subscriptionPeriod: 'P1M', introPrice: null },
};

describe('resolveBillingMode', () => {
  it('is live only with a key on a phone', () => {
    expect(resolveBillingMode({ hasKey: true, platform: 'ios', isDev: false })).toBe('live');
    expect(resolveBillingMode({ hasKey: true, platform: 'web', isDev: false })).toBe('preview');
  });
  it('previews in dev and on web, and is unavailable in a keyless production app', () => {
    expect(resolveBillingMode({ hasKey: false, platform: 'ios', isDev: true })).toBe('preview');
    expect(resolveBillingMode({ hasKey: false, platform: 'web', isDev: false })).toBe('preview');
    expect(resolveBillingMode({ hasKey: false, platform: 'ios', isDev: false })).toBe('unavailable');
  });
});

describe('store packages', () => {
  it('classifies by package type or period', () => {
    expect(planKind(yearly)).toBe('yearly');
    expect(planKind(monthly)).toBe('monthly');
    expect(planKind({ packageType: 'CUSTOM', product: { priceString: '$1', subscriptionPeriod: 'P1Y' } })).toBe('yearly');
    expect(planKind({ packageType: 'LIFETIME', product: { priceString: '$99' } })).toBe('other');
  });
  it('only reports a trial when the intro offer is free', () => {
    expect(trialDaysOf(yearly.product.introPrice)).toBe(3);
    expect(trialDaysOf({ price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 1 })).toBe(7);
    expect(trialDaysOf({ price: 0.99, periodUnit: 'MONTH', periodNumberOfUnits: 1 })).toBeNull();
    expect(trialDaysOf(null)).toBeNull();
    expect(trialDaysOf(undefined)).toBeNull();
  });
  it('uses the store price string untouched', () => {
    expect(toPlan(yearly)).toEqual({ id: '$rc_annual', kind: 'yearly', title: 'Yearly', priceLabel: '$29.99', periodLabel: 'per year', trialDays: 3, isSample: false });
    expect(toPlan(monthly).trialDays).toBeNull();
  });
  it('sorts yearly first and preselects it', () => {
    const plans = sortPlans([toPlan(monthly), toPlan(yearly)]);
    expect(plans.map((p) => p.kind)).toEqual(['yearly', 'monthly']);
    expect(defaultPlanId(plans)).toBe('$rc_annual');
    expect(defaultPlanId([toPlan(monthly)])).toBe('$rc_monthly');
    expect(defaultPlanId([])).toBeNull();
  });
});

describe('sample plans', () => {
  it('never carry a price', () => {
    for (const p of SAMPLE_PLANS) {
      expect(p.priceLabel).toBe(PRICE_PLACEHOLDER);
      expect(p.isSample).toBe(true);
    }
    expect(defaultPlanId(SAMPLE_PLANS)).toBe('sample_yearly');
  });
});

describe('renewalCopy', () => {
  it('always says that it renews and can be cancelled', () => {
    for (const p of [null, ...SAMPLE_PLANS, toPlan(yearly), toPlan(monthly)]) {
      expect(renewalCopy(p)).toMatch(/Renews automatically\. Cancel anytime\.$/);
    }
  });
  it('states the real price after a trial, and nothing extra without one', () => {
    expect(renewalCopy(toPlan(yearly))).toBe('3 days free, then $29.99 per year. Renews automatically. Cancel anytime.');
    expect(renewalCopy(toPlan(monthly))).toBe('Renews automatically. Cancel anytime.');
    expect(renewalCopy(null)).toBe('Renews automatically. Cancel anytime.');
  });
  it('labels the trial in three words or fewer', () => {
    expect(trialLabel(3)).toBe('3-day trial');
  });
  it('does not invent a price for sample plans', () => {
    expect(renewalCopy(SAMPLE_PLANS[0])).not.toMatch(/[$€£]\d/);
  });
});

describe('hasPremium', () => {
  it('reads the premium entitlement', () => {
    expect(hasPremium({ entitlements: { active: { premium: {} } } })).toBe(true);
    expect(hasPremium({ entitlements: { active: { other: {} } } })).toBe(false);
    expect(hasPremium(null)).toBe(false);
  });
});
