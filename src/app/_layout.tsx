import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { ThemePreferenceProvider } from '@/lib/theme-preference';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemePreferenceProvider>
        <SettingsProvider>
          <RootNavigator />
        </SettingsProvider>
      </ThemePreferenceProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const scheme = useColorScheme();
  const router = useRouter();
  const { ready } = useSettings();

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.getItem('worktracker.onboarding.v1').then((val) => {
      if (!val) router.replace('/onboarding');
    });
  }, [ready, router]);

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'WorkTracker' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
