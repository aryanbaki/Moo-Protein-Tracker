import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { CowLine, hrefOf, resumeStep, stepContextOf } from '../../features/onboarding';
import { Cow } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors } from '../../theme';

/** Entry point: resume a half-finished onboarding, otherwise play the splash. */
export default function OnboardingIndex() {
  // Read once: later step changes must not yank someone off the splash.
  const [resume] = useState(() => {
    const s = useProfile.getState();
    return resumeStep(s.onboardingStep, stepContextOf(s));
  });
  if (resume) return <Redirect href={hrefOf(resume)} />;
  return <Splash />;
}

const HOLD_MS = 2100;

function Splash() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const rise = useSharedValue(reduceMotion ? 0 : 260);
  const bubble = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) {
      rise.value = withDelay(200, withSpring(0, { damping: 11, stiffness: 120 }));
      bubble.value = withDelay(750, withSequence(withTiming(1.15, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 120 })));
    }
    const id = setTimeout(() => router.replace(hrefOf('welcome')), HOLD_MS);
    return () => clearTimeout(id);
  }, [bubble, reduceMotion, rise, router]);

  const cowStyle = useAnimatedStyle(() => ({ transform: [{ translateY: rise.value }] }));
  const bubbleStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, bubble.value), transform: [{ scale: bubble.value }] }));

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Moo! Tap to continue" onPress={() => router.replace(hrefOf('welcome'))} style={styles.screen}>
      <View style={styles.stage}>
        <Animated.View style={[styles.bubble, bubbleStyle]}>
          <CowLine text="MOO!" size={34} />
        </Animated.View>
        <View style={styles.window}>
          <Animated.View style={cowStyle}>
            <Cow size={240} headOnly pose="idle" />
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  stage: { alignItems: 'center' },
  bubble: { marginBottom: 12 },
  // The head rises from behind the bottom edge of this window.
  window: { overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', minHeight: 250, minWidth: 260 },
});
