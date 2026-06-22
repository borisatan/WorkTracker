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
    storage.set('calendarIds', settings.calendarIds);
    // Stored as a string so fractional hours survive (UserDefaults int would truncate).
    storage.set('hoursPerDay', String(settings.hoursPerDay));
    storage.set('periodStartDay', settings.periodStartDay);
    const { ExtensionStorage } = require('@bacons/apple-targets');
    ExtensionStorage.reloadWidget();
  } catch {
    // Ignore — widget sync is non-critical.
  }
}
