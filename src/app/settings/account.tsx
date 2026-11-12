import { router } from 'expo-router';
import { useState } from 'react';

import { AppText, Button } from '../../components';
import { useAuth } from '../../features/auth';
import { syncReminders } from '../../features/reminders';
import { ConfirmModal, Group, Note, Row, SettingsScreen } from '../../features/settings/ui';
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
      setError("Account deletion isn't available in this build.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res && !res.ok) {
        setError(res.error ?? "Couldn't delete the account. Try again.");
        return;
      }
      setConfirming(false);
      await syncReminders();
      // The profile was wiped: leave Settings so setup starts again.
      router.replace('/');
    } catch {
      setError("Couldn't delete the account. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsScreen title="Account">
      {user ? (
        <>
          <Group title="Signed in">
            <Row emoji="✉️" label={user.email ?? 'Apple account'} sublabel="Your log syncs to this account" />
          </Group>
          <Button title={busy && !confirming ? 'Signing out…' : 'Sign out'} variant="secondary" disabled={busy} onPress={() => void signOut()} />
          <AppText variant="caption">Signing out keeps what&apos;s on this device.</AppText>

          <Group title="Danger zone" footer="Deletes your account and everything stored for it on the server, then wipes this device. This can't be undone.">
            <Row emoji="🗑️" label="Delete account" danger onPress={() => { setError(null); setConfirming(true); }} />
          </Group>
        </>
      ) : (
        <>
          <Note>
            <AppText variant="label">{signedOut ? 'Signed out' : "You're not signed in"}</AppText>
            <AppText variant="caption">
              {backendConfigured
                ? 'Everything is saved on this device. Sign in to back it up and sync.'
                : "Everything is saved on this device. Accounts aren't switched on in this build yet."}
            </AppText>
          </Note>
          <Button title="Sign in" onPress={() => router.push({ pathname: '/auth' })} />
          <AppText variant="caption">No account means nothing to delete on a server. To wipe this device, use Settings → Your data.</AppText>
        </>
      )}
      {error && !confirming ? <AppText variant="caption" center accessibilityLiveRegion="polite">{error}</AppText> : null}

      <ConfirmModal
        visible={confirming}
        top={<Cow size={96} pose="shocked" accessibilityLabel="Moo the cow, shocked" />}
        title="Delete your account?"
        body="Your account, synced log and everything on this device will be gone for good."
        confirmLabel="Delete forever"
        requireText="DELETE"
        busy={busy}
        error={error}
        onConfirm={() => void deleteAccount()}
        onCancel={() => setConfirming(false)}
      />
    </SettingsScreen>
  );
}
