/**
 * Thin wrapper over expo-calendar (the SDK 56 class-based API) for permissions,
 * listing device calendars, and resolving matching work-day date keys.
 */

import * as Calendar from 'expo-calendar';

import { toDateKey, type Period } from './period';

export type DeviceCalendar = {
  id: string;
  title: string;
  /** Hex color the OS uses for the calendar, if any. */
  color?: string;
  /** Owning account/source name (e.g. "iCloud", "Gmail"). */
  source: string;
};

/** Requests calendar permission if needed; resolves to whether it's granted. */
export async function ensureCalendarPermission(): Promise<boolean> {
  const current = await Calendar.getCalendarPermissions();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const result = await Calendar.requestCalendarPermissions();
  return result.granted;
}

/** Lists the device's event calendars (requires permission). */
export async function listDeviceCalendars(): Promise<DeviceCalendar[]> {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  return calendars.map((c) => ({
    id: c.id,
    title: c.title,
    color: c.color,
    source: c.source?.name ?? '',
  }));
}

/**
 * Returns the set of `YYYY-MM-DD` keys for days within `period` that contain at
 * least one event whose title contains `searchString` (case-insensitive). A day
 * with multiple matches still yields a single key.
 */
export async function fetchMatchingDayKeys(
  searchString: string,
  calendarIds: string[],
  period: Period,
): Promise<Set<string>> {
  const keys = new Set<string>();
  const needle = searchString.trim().toLowerCase();
  if (!needle || calendarIds.length === 0) return keys;

  const events = await Calendar.listEvents(calendarIds, period.start, period.end);
  for (const event of events) {
    if (!event.title || !event.title.toLowerCase().includes(needle)) continue;
    const start = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    keys.add(toDateKey(start));
  }
  return keys;
}
