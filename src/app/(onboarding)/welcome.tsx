import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '../../components';
import { CowLine, useOnboardingNav } from '../../features/onboarding';
import { Cow } from '../../mascot';
import { colors, spacing } from '../../theme';

export default function Welcome() {
  const router = useRouter();
  const { next } = useOnboardingNav('welcome');
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <CowLine text="Hay there! I'm Moo." size={22} />
        <Cow size={250} pose="wave" />
        <View style={styles.text}>
          <AppText accessibilityRole="header" variant="title" center style={styles.title}>
            Track your protein.{'\n'}Fill the cow.
          </AppText>
          <AppText variant="body" center color={colors.textSecondary}>
            Hit your protein goal and I fill right up. It&apos;s udderly satisfying.
          </AppText>
        </View>
      </View>
      <View style={styles.footer}>
        <Button title="Get started" onPress={() => next()} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/auth', params: { flow: 'signin' } })}
          style={({ pressed }) => [styles.link, pressed ? { opacity: 0.6 } : null]}
        >
          <AppText variant="label" color={colors.textSecondary} center>
            I already have an account
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.sm },
  text: { gap: spacing.sm, marginTop: spacing.md },
  title: { lineHeight: 40 },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
});
