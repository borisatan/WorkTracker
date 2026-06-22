/**
 * Color-scheme preference: lets the user override the system light/dark setting
 * and persists the choice. Components read the effective scheme through
 * `@/hooks/use-color-scheme`, which resolves to `useColorScheme` below.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { syncThemeToWidget } from './widget-sync';

export type ColorScheme = 'light' | 'dark';
/** `'system'` follows the OS; otherwise a forced scheme. */
export type ThemePreference = 'system' | ColorScheme;

const STORAGE_KEY = 'cadenza.theme.v1';

type ContextValue = {
  preference: ThemePreference;
  /** The scheme actually in effect after applying the preference. */
  scheme: ColorScheme;
  setPreference: (p: ThemePreference) => void;
  /** Flip between light and dark (and away from following the system). */
  toggle: () => void;
};

const ThemePreferenceContext = createContext<ContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const system = useSystemColorScheme();
  const systemScheme: ColorScheme = system === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const stored = raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
        if (raw === 'light' || raw === 'dark' || raw === 'system') setPreferenceState(raw);
        syncThemeToWidget(stored);
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
    syncThemeToWidget(p);
  }, []);

  const scheme: ColorScheme = preference === 'system' ? systemScheme : preference;

  const toggle = useCallback(() => {
    setPreference(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setPreference]);

  return (
    <ThemePreferenceContext.Provider value={{ preference, scheme, setPreference, toggle }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ContextValue {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  return ctx;
}

/** Effective color scheme, honoring the user's manual override. */
export function useColorScheme(): ColorScheme {
  return useThemePreference().scheme;
}
