/**
 * Moo Premium paywall (modal, always closable).
 *
 * Route param `reason`: 'onboarding' | 'scan_limit' | 'history' | 'weekly'.
 * When reason is 'onboarding', leaving this screen (close or purchase) finishes
 * onboarding and lands on the tabs. Otherwise it just goes back.
 *
 * Honesty: prices and trials come from the store only. No countdowns, no
 * invented discounts, no made-up reviews.
 *
 * Copy: one headline, three benefit labels, the plans, one button and one legal
 * line. Keep it that short.
 */
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Screen } from '../components';
import {
  PRICE_PLACEHOLDER,
  PRICE_PLACEHOLDER_NOTE,
  PRIVACY_URL,
  TERMS_URL,
  defaultPlanId,
  initBilling,
  renewalCopy,
  trialLabel,
  useBilling,
  type PaywallReason,
  type Plan,
} from '../features/billing';
import { Cow } from '../mascot';
import { useProfile } from '../state/profile';
import { colors, radius, spacing } from '../theme';

const REASONS: PaywallReason[] = ['onboarding', 'scan_limit', 'history', 'weekly'];

const HEADLINE = 'Moo Premium';
/** The only reason that gets its own words: why the scanner sent you here. */
const REASON_TAG: Partial<Record<PaywallReason, string>> = { scan_limit: 'Out of free scans' };

const BENEFITS: { emoji: string; title: string }[] = [
  { emoji: '📸', title: 'Unlimited scans' },
  { emoji: '🗓️', title: 'Week view' },
  { emoji: '📈', title: 'Full history' },
];

export default function PaywallScreen() {
  const params = useLocalSearchParams<{ reason?: string }>();
  const reason = REASONS.includes(params.reason as PaywallReason) ? (params.reason as PaywallReason) : undefined;

  const isPremium = useBilling((s) => s.isPremium);
  const mode = useBilling((s) => s.mode);
  const offerings = useBilling((s) => s.offerings);
  const offeringsStatus = useBilling((s) => s.offeringsStatus);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'purchase' | 'restore'>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // On short screens the legal links move into the scroll area so the plans stay visible.
  const compact = height < 720;

  useEffect(() => {
    // The root layout normally does this at launch; harmless to repeat.
    void initBilling().then(() => {
      const s = useBilling.getState();
      if (s.mode === 'live' && s.offeringsStatus !== 'ready') void s.loadOfferings();
    });
  }, []);

  // Yearly is preselected until the user picks; also covers plans arriving late from the store.
  const selectedId = offerings.some((p) => p.id === pickedId) ? pickedId : defaultPlanId(offerings);

  const selected = offerings.find((p) => p.id === selectedId) ?? null;

  const leave = () => {
    if (reason === 'onboarding') {
      useProfile.getState().completeOnboarding();
      router.replace('/(tabs)');
    } else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const buy = async () => {
    if (!selected || busy) return;
    setError(null);
    setNotice(null);
    setBusy('purchase');
    const res = await useBilling.getState().purchase(selected);
    setBusy(null);
    if (!res.ok && !res.cancelled) setError(res.error);
  };

  const restore = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy('restore');
    const res = await useBilling.getState().restore();
    setBusy(null);
    if (!res.ok) setError(res.error);
    else if (!res.restored) setNotice('Nothing to restore.');
  };

  // Outside the scroll view so it can never scroll out of reach.
  const closeButton = (
    <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={leave} style={[styles.close, { top: insets.top + spacing.sm }]}>
      <AppText variant="heading" color={colors.textSecondary} style={styles.closeGlyph}>×</AppText>
    </Pressable>
  );

  const links = (
    <View style={styles.links}>
      <TextLink title={busy === 'restore' ? 'Restoring…' : 'Restore'} accessibilityLabel="Restore purchases" onPress={() => void restore()} disabled={!!busy} />
      <TextLink title="Terms" onPress={() => void Linking.openURL(TERMS_URL).catch(() => {})} />
      <TextLink title="Privacy" onPress={() => void Linking.openURL(PRIVACY_URL).catch(() => {})} />
    </View>
  );

  if (isPremium) {
    return (
      <View style={styles.root}>
        <Screen scroll footer={<Button title="Done" onPress={leave} />}>
          <View style={[styles.hero, styles.heroDone]}>
            <Cow size={220} pose="crown" accessibilityLabel="Moo the cow wearing a crown" />
            <AppText variant="title" center accessibilityRole="header">Premium on</AppText>
            {mode === 'preview' ? (
              <View style={styles.previewPill}>
                <AppText variant="small" color={colors.primaryDark}>Preview build: no charge</AppText>
              </View>
            ) : null}
          </View>
        </Screen>
        {closeButton}
      </View>
    );
  }

  const reasonTag = reason ? REASON_TAG[reason] : undefined;
  const cta = selected?.trialDays ? 'Start trial' : 'Subscribe';
  const canBuy = !!selected && mode !== 'unavailable' && !busy;

  return (
    <View style={styles.root}>
      <Screen
        scroll
        footer={
          <View style={styles.footer}>
            {error ? <AppText variant="caption" center color={colors.bad} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</AppText> : null}
            {notice && !error ? <AppText variant="caption" center accessibilityLiveRegion="polite">{notice}</AppText> : null}
            {mode === 'preview' ? (
              <View style={styles.previewPill}>
                <AppText variant="small" color={colors.primaryDark}>Preview build: no charge</AppText>
              </View>
            ) : null}
            <Button
              title={busy === 'purchase' ? 'Loading…' : cta}
              onPress={() => void buy()}
              disabled={!canBuy}
              accessibilityLabel={mode === 'preview' ? `${cta}. Preview build: no charge` : cta}
            />
            {mode === 'unavailable' ? (
              <AppText variant="small" center>Purchases are off in this build.</AppText>
            ) : (
              <AppText variant="small" center>{renewalCopy(selected)}</AppText>
            )}
            {compact ? null : links}
          </View>
        }
      >
        <View style={styles.hero}>
          <Cow size={compact ? 110 : 168} pose="crown" accessibilityLabel="Moo the cow wearing a crown" />
          <AppText variant="title" center accessibilityRole="header">{HEADLINE}</AppText>
          {reasonTag ? (
            <View style={styles.reasonTag}>
              <AppText variant="small" color={colors.text}>{reasonTag}</AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefit} accessible accessibilityLabel={b.title}>
              <View style={styles.benefitIcon}>
                <AppText variant="body">{b.emoji}</AppText>
              </View>
              <AppText variant="label" style={styles.benefitText}>{b.title}</AppText>
            </View>
          ))}
        </View>

        {mode === 'live' && offeringsStatus === 'loading' && offerings.length === 0 ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel="Loading plans" />
        ) : mode === 'live' && offerings.length === 0 ? (
          <View style={styles.plans}>
            <AppText variant="caption" center>Couldn&apos;t load plans.</AppText>
            <Button title="Retry" variant="secondary" onPress={() => void useBilling.getState().loadOfferings()} />
          </View>
        ) : (
          <View style={styles.plans} accessibilityRole="radiogroup" accessibilityLabel="Choose a plan">
            {offerings.map((p) => (
              <PlanCard key={p.id} plan={p} selected={p.id === selectedId} onPress={() => setPickedId(p.id)} />
            ))}
          </View>
        )}
        {compact ? links : null}
      </Screen>
      {closeButton}
    </View>
  );
}

function PlanCard({ plan, selected, onPress }: { plan: Plan; selected: boolean; onPress: () => void }) {
  const noPrice = plan.priceLabel === PRICE_PLACEHOLDER;
  const priceSpoken = noPrice ? PRICE_PLACEHOLDER_NOTE : `${plan.priceLabel} ${plan.periodLabel}`;
  const label = `${plan.title}, ${priceSpoken}${plan.trialDays ? `, ${trialLabel(plan.trialDays)}` : ''}`;
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={[styles.plan, selected ? styles.planSelected : null]}>
      <View style={[styles.radio, selected ? styles.radioOn : null]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={styles.planText}>
        <View style={styles.planTitleRow}>
          <AppText variant="label">{plan.title}</AppText>
          {plan.trialDays ? (
            <View style={styles.badge}>
              <AppText variant="small" color={colors.textOnPrimary}>{trialLabel(plan.trialDays)}</AppText>
            </View>
          ) : null}
        </View>
        {noPrice ? <AppText variant="small">{PRICE_PLACEHOLDER_NOTE}</AppText> : null}
      </View>
      <View style={styles.planPrice}>
        <AppText variant="label">{plan.priceLabel}</AppText>
        {plan.periodLabel ? <AppText variant="small">{plan.periodLabel}</AppText> : null}
      </View>
    </Pressable>
  );
}

function TextLink({ title, onPress, disabled, accessibilityLabel }: { title: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} hitSlop={4} style={styles.link}>
      <AppText variant="caption" style={styles.linkText}>{title}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroDone: { paddingTop: spacing.xxl },
  close: { position: 'absolute', right: spacing.md, width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  closeGlyph: { lineHeight: 30 },
  hero: { alignItems: 'center', gap: spacing.sm },
  reasonTag: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  benefits: { gap: 12 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1 },
  plans: { gap: spacing.sm },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  planSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 24, height: 24, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: radius.pill, backgroundColor: colors.primary },
  planText: { flex: 1, gap: 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  badge: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  planPrice: { alignItems: 'flex-end' },
  footer: { gap: spacing.sm },
  previewPill: { alignSelf: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: spacing.lg },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { textDecorationLine: 'underline' },
});
