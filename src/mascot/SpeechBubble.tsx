import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts } from '../theme';

export interface SpeechBubbleProps {
  text: string;
  /** Font size in points. */
  size?: number;
  /** Which bottom corner the tail hangs from (it points at the speaker). */
  tail?: 'left' | 'right';
}

const BORDER = 3;

/** Comic speech bubble that pops in whenever its text changes. */
export function SpeechBubble({ text, size = 30, tail = 'left' }: SpeechBubbleProps) {
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      pop.value = 1;
      return;
    }
    pop.value = withSequence(withTiming(0, { duration: 0 }), withSpring(1, { damping: 9, stiffness: 190, mass: 0.7 }));
  }, [text, reduced, pop]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 3),
    transform: [{ scale: 0.3 + pop.value * 0.7 }, { rotate: `${(1 - pop.value) * (tail === 'left' ? -10 : 10)}deg` }],
  }));

  const tw = size * 0.8;
  const th = size * 0.62;
  // Tail tip leans towards the speaker.
  const tip = tail === 'left' ? 0.12 : 0.88;
  const d = `M ${tw * 0.08} 0 L ${tw * tip} ${th - 2} L ${tw * 0.92} 0`;

  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Moo says: ${text}`}
      style={[styles.wrap, { transformOrigin: tail === 'left' ? '15% 100%' : '85% 100%', paddingBottom: th - BORDER }, style]}
    >
      <View style={[styles.bubble, { borderRadius: size * 0.7, paddingHorizontal: size * 0.6, paddingVertical: size * 0.28 }]}>
        <Text style={[styles.text, { fontSize: size, lineHeight: size * 1.2 }]}>{text}</Text>
      </View>
      <Svg width={tw} height={th} style={[styles.tail, tail === 'left' ? { left: size * 0.75 } : { right: size * 0.75 }]}>
        <Path d={`${d} Z`} fill={colors.surface} />
        <Path d={d} fill="none" stroke={colors.cowOutline} strokeWidth={BORDER} strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  bubble: { backgroundColor: colors.surface, borderWidth: BORDER, borderColor: colors.cowOutline },
  text: { fontFamily: fonts.black, color: colors.text, letterSpacing: 0.5, textAlign: 'center' },
  tail: { position: 'absolute', bottom: 0 },
});
