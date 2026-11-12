import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '../../components';
import { useCowSize, useOnboardingNav } from '../../features/onboarding';
import { Cow } from '../../mascot';
import { colors, spacing } from '../../theme';

export default function Welcome() {
  const router = useRouter();
  const { next } = useOnboardingNav('welcome');
  const cowSize = useCowSize(300);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <Cow size={cowSize} pose="wave" />
        <AppText accessibilityRole="header" variant="heading" center style={styles.title}>
          Track protein.{'\n'}Fill the cow.
        </AppText>
      </View>
      <View style={styles.footer}>
        <Button title="Start" onPress={() => next()} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/auth', params: { flow: 'signin' } })}
          style={({ pressed }) => [styles.link, pressed ? { opacity: 0.6 } : null]}
        >
          <AppText variant="label" color={colors.textSecondary} center>
            Sign in
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.xl },
  title: { lineHeight: 36 },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
});
