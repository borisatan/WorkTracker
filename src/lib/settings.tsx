/**
 * App settings: persisted to AsyncStorage and shared via React context so the
 * Dashboard and Settings screens stay in sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { syncSettingsToWidget } from './widget-sync';

export type Settings = {
  /** Substring matched (case-insensitive) against event titles. */
  searchString: string;
  /** Hours credited per work day. */
  hoursPerDay: number;
  /** Day-of-month the period starts on (1..31). */
  periodStartDay: number;
  /** IDs of device calendars to search. */
  calendarIds: string[];
};

export const DEFAULT_SETTINGS: Settings = {
  searchString: '',
  hoursPerDay: 8,
  periodStartDay: 1,
  calendarIds: [],
};

const STORAGE_KEY = 'cadenza.settings.v1';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

type SettingsContextValue = {
  settings: Settings;
  /** False until settings have been loaded from storage. */
  ready: boolean;
  /** Merge a partial update and persist it. */
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadSettings().then((loaded) => {
      if (!active) return;
      setSettings(loaded);
      setReady(true);
      syncSettingsToWidget(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next).catch(() => {});
      syncSettingsToWidget(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, ready, update }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}

/** True when the user has configured enough to produce results. */
export function isConfigured(settings: Settings): boolean {
  return settings.searchString.trim().length > 0 && settings.calendarIds.length > 0;
}
