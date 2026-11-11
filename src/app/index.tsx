import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text accessible={false} style={styles.mascot}>🐮</Text>
        <Text accessibilityRole="header" style={styles.title}>Moo</Text>
        <Text style={styles.subtitle}>Your daily protein buddy.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  mascot: { fontSize: typography.sizes.mascot },
  title: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    textAlign: 'center',
  },
});
