import { Nunito_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initAuth } from '../features/auth';
import { initBilling } from '../features/billing';
import { useLog } from '../features/log';
import { syncReminders } from '../features/reminders';
import { startSync } from '../features/sync';
import { useProfile } from '../state/profile';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });
  const hydrated = useProfile((s) => s.hydrated);
  const onboardingComplete = useProfile((s) => s.onboardingComplete);
  const logReady = useLog((s) => s.ready);
  const ready = (fontsLoaded || !!fontError) && hydrated && logReady;

  useEffect(() => {
    void useLog.getState().init();
    void initAuth().then(() => startSync()).catch(() => {});
    void initBilling().catch(() => {});
    void syncReminders().catch(() => {});
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Protected guard={!onboardingComplete}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected guard={onboardingComplete}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="entry" options={{ presentation: 'modal' }} />
            <Stack.Screen name="food-search" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" />
          </Stack.Protected>
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
