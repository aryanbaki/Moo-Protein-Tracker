/**
 * Sign in / create account (modal).
 *
 * Route param `flow`:
 *  - 'onboarding': last step before the paywall. Success or skip both continue to the paywall.
 *  - 'signin': "I already have an account" from the Welcome screen. Success restores the saved plan.
 *  - none: opened from Settings. Success just closes.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Card, Screen } from '../../components';
import { EMAIL_CODE_LENGTH, isCompleteCode, isValidEmail, normalizeCode, normalizeEmail, useAuth, type AuthResult } from '../../features/auth';
import { restoreProfileFromServer, syncNow } from '../../features/sync';
import { Cow } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, fonts, radius, spacing } from '../../theme';

type Flow = 'onboarding' | 'signin' | undefined;
type Step = 'start' | 'code' | 'no_plan';

const RESEND_SECONDS = 30;

function closeModal() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function AuthScreen() {
  const params = useLocalSearchParams<{ flow?: string }>();
  const flow: Flow = params.flow === 'onboarding' || params.flow === 'signin' ? params.flow : undefined;

  const backendConfigured = useAuth((s) => s.backendConfigured);
  const ready = useAuth((s) => s.ready);
  const appleAvailable = useAuth((s) => s.appleAvailable);

  const [step, setStep] = useState<Step>('start');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<null | 'apple' | 'send' | 'verify' | 'resend' | 'restore'>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const insets = useSafeAreaInsets();
  const codeInput = useRef<ComponentRef<typeof TextInput>>(null);

  // The integrator calls initAuth() in the root layout; this covers a deep link straight here.
  useEffect(() => {
    void useAuth.getState().init();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const goToPaywall = () => router.replace({ pathname: '/paywall', params: { reason: 'onboarding' } });

  const skip = () => {
    if (flow === 'onboarding') goToPaywall();
    else closeModal();
  };

  const onSignedIn = async () => {
    if (flow === 'onboarding') {
      // Push the plan just made in onboarding (never blocks the UI; retried later if offline).
      void syncNow();
      goToPaywall();
      return;
    }
    if (flow === 'signin') {
      setBusy('restore');
      const restored = await restoreProfileFromServer();
      setBusy(null);
      // Bring the logs back too. Runs after the plan restore so the two cannot race.
      void syncNow();
      if (restored) {
        useProfile.getState().completeOnboarding();
        router.replace('/(tabs)');
      } else {
        setStep('no_plan');
      }
      return;
    }
    void syncNow();
    closeModal();
  };

  const handle = async (kind: NonNullable<typeof busy>, action: () => Promise<AuthResult>, onOk: () => void | Promise<void>) => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(kind);
    const res = await action();
    setBusy(null);
    if (res.ok) await onOk();
    else if (!res.cancelled) setError(res.error);
  };

  const sendCode = (kind: 'send' | 'resend') =>
    handle(kind, () => useAuth.getState().sendEmailCode(email), () => {
      setStep('code');
      setCode('');
      setResendIn(RESEND_SECONDS);
      if (kind === 'resend') setNotice('New code sent.');
      setTimeout(() => codeInput.current?.focus(), 50);
    });

  const verify = () => handle('verify', () => useAuth.getState().verifyEmailCode(email, code), onSignedIn);
  const apple = () => handle('apple', () => useAuth.getState().signInWithApple(), onSignedIn);

  const emailOk = isValidEmail(email);
  const codeOk = isCompleteCode(code);
  const skipLabel = flow === 'onboarding' ? 'Skip for now' : 'Not now';

  const title = step === 'no_plan' ? "You're signed in" : flow === 'signin' ? 'Welcome back' : 'Save your progress';
  const subtitle =
    step === 'no_plan'
      ? "There's no saved plan on this account yet. Finish the quick setup and Moo will keep it safe from here."
      : flow === 'signin'
        ? 'Sign in and Moo will fetch your goals and your logs.'
        : 'Create a free account so your goals, your logs and your cow follow you to any phone.';

  return (
    <View style={styles.root}>
      <Screen
        scroll
        footer={
          backendConfigured && step !== 'no_plan' ? (
            <Button title={skipLabel} variant="ghost" onPress={skip} disabled={busy === 'restore'} accessibilityHint={flow === 'onboarding' ? 'Continues without an account' : 'Closes this screen'} />
          ) : null
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
          <View style={styles.hero}>
            <Cow size={150} pose={step === 'no_plan' ? 'shrug' : 'wave'} accessibilityLabel="Moo the cow waving" />
            <AppText variant="heading" center accessibilityRole="header">{title}</AppText>
            <AppText variant="body" center color={colors.textSecondary}>{subtitle}</AppText>
          </View>

          {!backendConfigured ? (
            <View style={styles.block}>
              <Card style={styles.infoCard}>
                <AppText variant="label">Accounts aren&apos;t switched on in this build</AppText>
                <AppText variant="caption">Everything you log is saved on this device. You can add an account later from Settings once sign-in is available.</AppText>
              </Card>
              <Pressable accessibilityRole="button" onPress={skip} style={({ pressed }) => [styles.wideButton, pressed ? styles.pressed : null]}>
                <AppText variant="label" center color={colors.textOnPrimary} style={styles.wideButtonText}>Continue without an account</AppText>
              </Pressable>
            </View>
          ) : !ready ? (
            <ActivityIndicator color={colors.primary} accessibilityLabel="Loading" />
          ) : step === 'no_plan' ? (
            <View style={styles.block}>
              <Button title="Finish setup" onPress={closeModal} />
            </View>
          ) : step === 'start' ? (
            <View style={styles.block}>
              {appleAvailable ? (
                <>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={flow === 'signin' ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN : AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={29}
                    style={styles.appleButton}
                    onPress={apple}
                  />
                  <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <View style={styles.rule} />
                    <AppText variant="caption">or</AppText>
                    <View style={styles.rule} />
                  </View>
                </>
              ) : null}
              <AppText variant="label">Email</AppText>
              <TextInput
                accessibilityLabel="Email address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                inputMode="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="send"
                editable={!busy}
                onSubmitEditing={() => (emailOk ? void sendCode('send') : setError("That email doesn't look right."))}
                style={[styles.input, error ? styles.inputError : null]}
              />
              <ErrorLine text={error} />
              <Button title={busy === 'send' ? 'Sending…' : 'Email me a code'} onPress={() => void sendCode('send')} disabled={!emailOk || !!busy} />
              <AppText variant="small" center>We&apos;ll email a {EMAIL_CODE_LENGTH}-digit code. No password to remember.</AppText>
            </View>
          ) : (
            <View style={styles.block}>
              <AppText variant="label">Enter the {EMAIL_CODE_LENGTH}-digit code</AppText>
              <AppText variant="caption">Sent to {normalizeEmail(email)}. It can take a minute; check spam too.</AppText>
              <TextInput
                ref={codeInput}
                accessibilityLabel={`${EMAIL_CODE_LENGTH}-digit code`}
                value={code}
                onChangeText={(t) => {
                  setCode(normalizeCode(t));
                  setError(null);
                }}
                placeholder="••••••"
                placeholderTextColor={colors.border}
                inputMode="numeric"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={EMAIL_CODE_LENGTH + 2}
                editable={busy !== 'verify' && busy !== 'restore'}
                onSubmitEditing={() => (codeOk ? void verify() : undefined)}
                style={[styles.input, styles.codeInput, error ? styles.inputError : null]}
              />
              <ErrorLine text={error} />
              {notice && !error ? <AppText variant="caption" center color={colors.good} accessibilityLiveRegion="polite">{notice}</AppText> : null}
              <Button title={busy === 'verify' ? 'Checking…' : busy === 'restore' ? 'Fetching your plan…' : 'Verify'} onPress={() => void verify()} disabled={!codeOk || !!busy} />
              <View style={styles.linkRow}>
                <LinkButton
                  title={resendIn > 0 ? `Resend code in ${resendIn}s` : busy === 'resend' ? 'Sending…' : 'Resend code'}
                  disabled={resendIn > 0 || !!busy}
                  onPress={() => void sendCode('resend')}
                />
                <LinkButton
                  title="Use a different email"
                  disabled={!!busy}
                  onPress={() => {
                    setStep('start');
                    setCode('');
                    setError(null);
                    setNotice(null);
                  }}
                />
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Screen>
      {/* Outside the scroll view so it is always reachable. */}
      <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={skip} style={[styles.close, { top: insets.top + spacing.sm }]}>
        <AppText variant="heading" color={colors.textSecondary} style={styles.closeGlyph}>×</AppText>
      </Pressable>
    </View>
  );
}

function ErrorLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <AppText variant="caption" color={colors.bad} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      {text}
    </AppText>
  );
}

function LinkButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} hitSlop={6} style={styles.link}>
      <AppText variant="label" color={disabled ? colors.textSecondary : colors.primary} style={disabled ? null : styles.linkText}>{title}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  root: { flex: 1, backgroundColor: colors.background },
  // Same pill as Button, with type small enough for the long label to stay on one line.
  wideButton: { minHeight: 58, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  wideButtonText: { fontFamily: fonts.black, fontSize: 15, letterSpacing: 0.5, textTransform: 'uppercase' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  close: { position: 'absolute', right: spacing.md, width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  closeGlyph: { lineHeight: 30 },
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  block: { gap: spacing.md },
  infoCard: { gap: spacing.xs },
  appleButton: { height: 58, width: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rule: { flex: 1, height: 1, backgroundColor: colors.border },
  input: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
  },
  inputError: { borderColor: colors.bad },
  codeInput: { fontFamily: fonts.black, fontSize: 28, letterSpacing: 8, textAlign: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { textDecorationLine: 'underline' },
});
