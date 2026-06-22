/**
 * Orchestrates the dashboard data: resolves the active period, checks calendar
 * permission, fetches matching events, and aggregates them into WorkStats.
 */

import { useCallback, useEffect, useState } from 'react';

import { ensureCalendarPermission, fetchMatchingDayKeys } from '@/lib/calendar';
import { getPeriod, toDateKey, type Period } from '@/lib/period';
import { isConfigured, type Settings } from '@/lib/settings';
import { computeStats, type WorkStats } from '@/lib/workdays';

export type WorkDataState = {
  loading: boolean;
  /** False when calendar permission is not granted. */
  permission: boolean;
  /** True once settings have a search string and at least one calendar. */
  configured: boolean;
  period: Period;
  /** Period-scoped totals for the headline. */
  stats: WorkStats;
  /** All matched worked days (<= today) across the visible ±1 year range. */
  workedKeys: string[];
  /** All matched scheduled days (> today) across the visible ±1 year range. */
  scheduledKeys: string[];
  error: string | null;
};

/** How far back and forward the calendar (and event fetch) reaches. */
const RANGE_YEARS = 1;

const EMPTY_STATS: WorkStats = {
  workedDays: 0,
  projectedDays: 0,
  workedHours: 0,
  projectedHours: 0,
  pastKeys: [],
  futureKeys: [],
};

/** Returns a copy of `d` shifted by whole calendar years. */
function addYears(d: Date, years: number): Date {
  const copy = new Date(d);
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
}

export function useWorkData(settings: Settings, settingsReady: boolean) {
  const [state, setState] = useState<WorkDataState>(() => ({
    loading: true,
    permission: true,
    configured: false,
    period: getPeriod(settings.periodStartDay),
    stats: EMPTY_STATS,
    workedKeys: [],
    scheduledKeys: [],
    error: null,
  }));

  const refresh = useCallback(async () => {
    const period = getPeriod(settings.periodStartDay);
    const configured = isConfigured(settings);

    setState((prev) => ({ ...prev, loading: true, error: null, period, configured }));

    if (!configured) {
      setState((prev) => ({
        ...prev,
        loading: false,
        stats: EMPTY_STATS,
        workedKeys: [],
        scheduledKeys: [],
        permission: true,
      }));
      return;
    }

    try {
      const permission = await ensureCalendarPermission();
      if (!permission) {
        setState((prev) => ({
          ...prev,
          loading: false,
          permission: false,
          stats: EMPTY_STATS,
          workedKeys: [],
          scheduledKeys: [],
        }));
        return;
      }

      // Fetch a ±1 year window so the calendar can show past and upcoming work
      // days, then scope the headline totals to just the active period.
      const now = new Date();
      const dayKeys = await fetchMatchingDayKeys(
        settings.searchString,
        settings.calendarIds,
        addYears(now, -RANGE_YEARS),
        addYears(now, RANGE_YEARS),
      );

      const startKey = toDateKey(period.start);
      const endKey = toDateKey(period.end); // exclusive
      const periodKeys = [...dayKeys].filter((k) => k >= startKey && k < endKey);

      const stats = computeStats(periodKeys, settings.hoursPerDay, now);
      const all = computeStats(dayKeys, settings.hoursPerDay, now);
      setState({
        loading: false,
        permission: true,
        configured: true,
        period,
        stats,
        workedKeys: all.pastKeys,
        scheduledKeys: all.futureKeys,
        error: null,
      });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to read calendar',
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (settingsReady) refresh();
  }, [settingsReady, refresh]);

  return { ...state, refresh };
}
