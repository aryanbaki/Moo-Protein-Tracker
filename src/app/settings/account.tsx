import { router } from 'expo-router';
import { useState } from 'react';

import { AppText, Button } from '../../components';
import { useAuth } from '../../features/auth';
import { syncReminders } from '../../features/reminders';
import { ConfirmModal, Group, Row, SettingsScreen } from '../../features/settings/ui';
import { Cow } from '../../mascot';

export default function AccountSettings() {
  const user = useAuth((s) => s.user);
  const backendConfigured = useAuth((s) => s.backendConfigured);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await useAuth.getState().signOut();
      setSignedOut(true);
    } catch {
      setError("Couldn't sign out. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    // Older builds of the auth store may not have deleteAccount; check before calling.
    const fn = (useAuth.getState() as { deleteAccount?: () => Promise<{ ok: boolean; error?: string } | void> }).deleteAccount;
    if (!fn) {
      setError('Deletion is off in this build.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res && !res.ok) {
        setError(res.error ?? "Couldn't delete. Try again.");
        return;
      }
      setConfirming(false);
      await syncReminders();
      // The profile was wiped: leave Settings so setup starts again.
      router.replace('/');
    } catch {
      setError("Couldn't delete. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsScreen title="Account">
      {user ? (
        <>
          <Group>
            <Row emoji="✉️" label={user.email ?? 'Apple account'} />
          </Group>
          <Button title={busy && !confirming ? 'Wait…' : 'Sign out'} variant="secondary" disabled={busy} onPress={() => void signOut()} />

          <Group>
            <Row emoji="🗑️" label="Delete account" danger onPress={() => { setError(null); setConfirming(true); }} />
          </Group>
        </>
      ) : (
        <>
          <Group>
            <Row emoji="👤" label={signedOut ? 'Signed out' : 'Not signed in'} />
          </Group>
          {backendConfigured ? null : <AppText variant="caption" center>Accounts are off in this build.</AppText>}
          <Button title="Sign in" onPress={() => router.push({ pathname: '/auth' })} />
        </>
      )}
      {error && !confirming ? <AppText variant="caption" center accessibilityLiveRegion="polite">{error}</AppText> : null}

      <ConfirmModal
        visible={confirming}
        top={<Cow size={96} pose="shocked" accessibilityLabel="Moo the cow, shocked" />}
        title="Delete account?"
        body="Account and device data. Can't be undone."
        confirmLabel="Delete"
        requireText="DELETE"
        busy={busy}
        error={error}
        onConfirm={() => void deleteAccount()}
        onCancel={() => setConfirming(false)}
      />
    </SettingsScreen>
  );
}
