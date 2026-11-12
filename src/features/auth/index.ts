/**
 * Accounts: Supabase Auth behind a small zustand store.
 *
 * Without EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY the app is
 * "local-only": `backendConfigured` is false, nobody is ever signed in, and
 * every action returns a friendly failure instead of throwing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Apple from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { getSupabase, supabaseConfigured } from '../../lib/supabase';
import { useProfile } from '../../state/profile';
import { useLog } from '../log';
import { SYNC_META_KEY } from '../sync/meta';
import { friendlyAuthError, isValidEmail, normalizeCode, normalizeEmail } from './validate';

export { EMAIL_CODE_LENGTH, isCompleteCode, isValidEmail, normalizeCode, normalizeEmail } from './validate';

export interface AuthUser {
  id: string;
  email: string | null;
}

export type AuthResult = { ok: true } | { ok: false; error: string; cancelled?: boolean };

export interface AuthState {
  /** False until the stored session (if any) has been read. */
  ready: boolean;
  user: AuthUser | null;
  /** True when Supabase env config is present. When false the app runs local-only. */
  backendConfigured: boolean;
  /** Sign in with Apple can be offered on this device (iOS 13+, backend configured). */
  appleAvailable: boolean;
  /** Read the stored session and start listening for changes. Safe to call more than once. */
  init: () => Promise<void>;
  signInWithApple: () => Promise<AuthResult>;
  /** Email a 6-digit one-time code. Creates the account if it does not exist. */
  sendEmailCode: (email: string) => Promise<AuthResult>;
  verifyEmailCode: (email: string, code: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /**
   * Delete the account and everything stored for it on the server, then wipe
   * this device. When nobody is signed in it only wipes this device.
   */
  deleteAccount: () => Promise<AuthResult>;
}

const NOT_CONFIGURED = "Accounts aren't switched on in this build.";

function toUser(u: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  return u ? { id: u.id, email: u.email ?? null } : null;
}

let initPromise: Promise<void> | null = null;

async function wipeLocalData(): Promise<void> {
  await useLog.getState().clearAll();
  useProfile.getState().resetProfile();
  try {
    await AsyncStorage.removeItem(SYNC_META_KEY);
  } catch {
    // ignore
  }
}

export const useAuth = create<AuthState>()((set, get) => ({
  ready: !supabaseConfigured,
  user: null,
  backendConfigured: supabaseConfigured,
  appleAvailable: false,

  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const supabase = getSupabase();
      if (!supabase) {
        set({ ready: true });
        return;
      }
      try {
        supabase.auth.onAuthStateChange((_event, session) => {
          const next = toUser(session?.user);
          const prev = get().user;
          // Token refreshes fire this too; only publish real changes.
          if (prev?.id !== next?.id || prev?.email !== next?.email) set({ user: next });
        });
        const { data } = await supabase.auth.getSession();
        set({ user: toUser(data.session?.user) });
      } catch {
        // Offline or corrupt session: stay signed out, the app still works locally.
      }
      if (Platform.OS === 'ios') {
        try {
          set({ appleAvailable: await Apple.isAvailableAsync() });
        } catch {
          set({ appleAvailable: false });
        }
      }
      set({ ready: true });
    })();
    return initPromise;
  },

  signInWithApple: async () => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    if (Platform.OS !== 'ios') return { ok: false, error: 'Sign in with Apple needs an iPhone.' };
    try {
      if (!(await Apple.isAvailableAsync())) return { ok: false, error: "Sign in with Apple isn't available on this device." };
      // Apple gets the SHA-256 of the nonce; Supabase gets the raw value and checks they match.
      const rawNonce = Crypto.randomUUID() + Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const credential = await Apple.signInAsync({
        requestedScopes: [Apple.AppleAuthenticationScope.EMAIL],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) return { ok: false, error: "Apple didn't finish signing you in. Please try again." };
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) return { ok: false, error: friendlyAuthError(error) };
      set({ user: toUser(data.user) });
      return { ok: true };
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
      if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') return { ok: false, error: '', cancelled: true };
      return { ok: false, error: friendlyAuthError(err) };
    }
  },

  sendEmailCode: async (email) => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    if (!isValidEmail(email)) return { ok: false, error: "That email doesn't look right." };
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizeEmail(email),
        options: { shouldCreateUser: true },
      });
      return error ? { ok: false, error: friendlyAuthError(error) } : { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  },

  verifyEmailCode: async (email, code) => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizeEmail(email),
        token: normalizeCode(code),
        type: 'email',
      });
      if (error) return { ok: false, error: friendlyAuthError(error) };
      set({ user: toUser(data.user) });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    try {
      // Local scope: sign this device out even when offline.
      await supabase?.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
    set({ user: null });
  },

  deleteAccount: async () => {
    const supabase = getSupabase();
    if (supabase && get().user) {
      try {
        const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
        if (error) return { ok: false, error: "Couldn't delete your account. Check your connection and try again." };
      } catch {
        return { ok: false, error: "Couldn't delete your account. Check your connection and try again." };
      }
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // The server-side user is already gone; the local session is cleared below anyway.
      }
      set({ user: null });
    }
    await wipeLocalData();
    return { ok: true };
  },
}));

/** Call once from the root layout. */
export function initAuth(): Promise<void> {
  return useAuth.getState().init();
}
