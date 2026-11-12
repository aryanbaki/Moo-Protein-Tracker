import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { AppText } from '../../components';
import { LEGAL_LINKS_ARE_PLACEHOLDERS, PRIVACY_URL, TERMS_URL } from '../../features/billing';
import { Group, Note, Row, SettingsScreen } from '../../features/settings/ui';
import { Cow } from '../../mascot';
import { spacing } from '../../theme';

export default function AboutSettings() {
  const version = Constants.expoConfig?.version ?? 'unknown';
  const [error, setError] = useState<string | null>(null);

  const openLink = (url: string) => () => {
    setError(null);
    Linking.openURL(url).catch(() => setError("Couldn't open that link."));
  };

  return (
    <SettingsScreen title="About Moo">
      <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
        <Cow size={140} pose="wave" accessibilityLabel="Moo the cow, waving" />
        <AppText variant="heading" center>Moo</AppText>
        <AppText variant="caption" center>Track your protein. Fill the cow.</AppText>
        <AppText variant="caption" center>{`Version ${version}`}</AppText>
      </View>

      <Note>
        <AppText variant="label">Estimates only, not medical advice</AppText>
        <AppText variant="caption">Goals come from standard formulas and photo scans are rough guesses you can always edit. Talk to a doctor or dietitian about anything health-related.</AppText>
      </Note>

      <Group title="Legal" footer={LEGAL_LINKS_ARE_PLACEHOLDERS && __DEV__ ? 'Dev note: these links are still placeholders.' : undefined}>
        <Row label="Terms of use" onPress={openLink(TERMS_URL)} />
        <Row label="Privacy policy" onPress={openLink(PRIVACY_URL)} />
      </Group>
      {error ? <AppText variant="caption" center accessibilityLiveRegion="polite">{error}</AppText> : null}

      <Group title="Credits">
        <Row label="Barcode data" sublabel="Open Food Facts, under the Open Database License" />
      </Group>

      {__DEV__ ? (
        <Group title="Developer">
          <Row emoji="🖼️" label="Cow gallery" onPress={() => router.push('/dev/gallery')} />
        </Group>
      ) : null}
    </SettingsScreen>
  );
}
