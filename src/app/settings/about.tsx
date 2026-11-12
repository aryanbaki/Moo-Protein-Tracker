import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { AppText } from '../../components';
import { PRIVACY_URL, TERMS_URL } from '../../features/billing';
import { Group, Note, Row, SettingsScreen } from '../../features/settings/ui';
import { Cow } from '../../mascot';
import { spacing } from '../../theme';

export default function AboutSettings() {
  const version = Constants.expoConfig?.version ?? 'unknown';
  const [error, setError] = useState<string | null>(null);

  const openLink = (url: string) => () => {
    setError(null);
    Linking.openURL(url).catch(() => setError("Couldn't open link."));
  };

  return (
    <SettingsScreen title="About Moo">
      <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
        <Cow size={140} pose="wave" accessibilityLabel="Moo the cow, waving" />
        <AppText variant="heading" center>Moo</AppText>
        <AppText variant="caption" center accessibilityLabel={`Version ${version}`}>{`v${version}`}</AppText>
      </View>

      <Note>Not medical advice.</Note>

      <Group>
        <Row label="Terms" accessibilityLabel="Terms of use" onPress={openLink(TERMS_URL)} />
        <Row label="Privacy" accessibilityLabel="Privacy policy" onPress={openLink(PRIVACY_URL)} />
      </Group>
      {error ? <AppText variant="caption" center accessibilityLiveRegion="polite">{error}</AppText> : null}

      <Group>
        <Row label="Food data" value="Open Food Facts · ODbL" />
        <Row label="Food data" value="USDA FoodData Central · public domain" />
        <Row label="Barcode check" value="Powered by FatSecret" />
      </Group>

      {__DEV__ ? (
        <Group>
          <Row emoji="🖼️" label="Cow gallery" onPress={() => router.push('/dev/gallery')} />
        </Group>
      ) : null}
    </SettingsScreen>
  );
}
