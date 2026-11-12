import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card } from '../../components';
import { FREE_PHOTO_SCANS, presentPaywall, useBilling } from '../../features/billing';
import { Group, Row, SettingsScreen } from '../../features/settings/ui';
import { Cow } from '../../mascot';
import { spacing } from '../../theme';

type RestoreFn = () => Promise<{ ok: boolean; restored?: boolean; error?: string } | void>;

export default function SubscriptionSettings() {
  const isPremium = useBilling((s) => s.isPremium);
  const used = useBilling((s) => s.photoScansUsed);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Restore is optional in the billing contract; only offer it when it exists.
  const restore = (useBilling.getState() as { restore?: RestoreFn }).restore;

  const onRestore = async () => {
    if (!restore) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await restore();
      if (res && !res.ok) setMessage(res.error ?? "Couldn't restore. Try again.");
      else if (useBilling.getState().isPremium) setMessage('Premium restored');
      else setMessage('Nothing to restore.');
    } catch {
      setMessage("Couldn't restore. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsScreen title="Subscription">
      <Card>
        <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
          <Cow size={120} pose={isPremium ? 'crown' : 'idle'} accessibilityLabel={isPremium ? 'Moo the cow wearing a crown' : 'Moo the cow'} />
          <AppText variant="heading" center>{isPremium ? 'Premium' : 'Free'}</AppText>
          {isPremium ? null : (
            <AppText variant="caption" center accessibilityLabel={`${Math.min(used, FREE_PHOTO_SCANS)} of ${FREE_PHOTO_SCANS} free photo scans used`}>
              {`${Math.min(used, FREE_PHOTO_SCANS)} / ${FREE_PHOTO_SCANS} scans`}
            </AppText>
          )}
        </View>
      </Card>

      {isPremium ? (
        <AppText variant="caption" center>Manage in the App Store.</AppText>
      ) : (
        <>
          <Group>
            <Row emoji="📸" label="Unlimited scans" />
            <Row emoji="🗓️" label="Week view" />
            <Row emoji="📈" label="Full history" />
          </Group>
          <Button title="Go Premium" onPress={() => presentPaywall()} />
        </>
      )}

      {restore ? <Button title={busy ? 'Restoring…' : 'Restore'} accessibilityLabel="Restore purchases" variant="ghost" disabled={busy} onPress={() => void onRestore()} /> : null}
      {message ? <AppText variant="caption" center accessibilityLiveRegion="polite">{message}</AppText> : null}
    </SettingsScreen>
  );
}
