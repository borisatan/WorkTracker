/**
 * Mirrors the user's settings into the shared App Group so the iOS home-screen
 * widget can read the calendar live with the same configuration as the app.
 * The widget UI is native (WidgetKit); see targets/widget/.
 */

import { Platform } from 'react-native';

import type { Settings } from './settings';

/** Must match the App Group in app.json and targets/widget/expo-target.config.js. */
const APP_GROUP = 'group.com.worktracker.app';

// Lazily required so the app still runs where the native module is absent
// (Android, web, Expo Go). `ExtensionStorage` is a no-op there.
function getStorage(): { set: (k: string, v: unknown) => void } | null {
  if (Platform.OS !== 'ios') return null;
  try {
    const { ExtensionStorage } = require('@bacons/apple-targets');
    return new ExtensionStorage(APP_GROUP);
  } catch {
    return null;
  }
}

/**
 * Writes the widget-relevant settings to the App Group and asks WidgetKit to
 * reload. Best-effort: silently no-ops when the native module is unavailable.
 *
 * Key names/types must stay in sync with `WorkSettings.load()` in
 * targets/widget/WorkData.swift.
 */
export function syncSettingsToWidget(settings: Settings): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.set('searchString', settings.searchString);
    // Stored as a JSON string, not a raw array: the native `setArray` bridge
    // expects an array of dictionaries and persists as opaque JSON Data, which
    // the widget can't read back via `array(forKey:)`. A string round-trips
    // reliably. Decoded by `WorkSettings.load()` in targets/widget/WorkData.swift.
    storage.set('calendarIds', JSON.stringify(settings.calendarIds));
    // Stored as a string so fractional hours survive (UserDefaults int would truncate).
    storage.set('hoursPerDay', String(settings.hoursPerDay));
    storage.set('periodStartDay', settings.periodStartDay);
    const { ExtensionStorage } = require('@bacons/apple-targets');
    ExtensionStorage.reloadWidget();
  } catch {
    // Ignore — widget sync is non-critical.
  }
}

/**
 * Mirrors the app's theme preference to the App Group so the widget can match a
 * manual light/dark override. iOS widgets otherwise only follow the system
 * appearance. Read by `themeOverride()` in targets/widget/WorkTrackerWidget.swift;
 * 'system' (or absent) means follow the system.
 */
export function syncThemeToWidget(preference: 'system' | 'light' | 'dark'): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.set('themePreference', preference);
    const { ExtensionStorage } = require('@bacons/apple-targets');
    ExtensionStorage.reloadWidget();
  } catch {
    // Ignore — widget sync is non-critical.
  }
}
