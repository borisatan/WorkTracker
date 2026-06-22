/**
 * Orchestrates the dashboard data: resolves the active period, checks calendar
 * permission, fetches matching events, and aggregates them into WorkStats.
 */

import { useCallback, useEffect, useState } from 'react';

import { ensureCalendarPermission, fetchMatchingDayKeys } from '@/lib/calendar';
import { getPeriod, type Period } from '@/lib/period';
import { isConfigured, type Settings } from '@/lib/settings';
import { computeStats, type WorkStats } from '@/lib/workdays';

export type WorkDataState = {
  loading: boolean;
  /** False when calendar permission is not granted. */
  permission: boolean;
  /** True once settings have a search string and at least one calendar. */
  configured: boolean;
  period: Period;
  stats: WorkStats;
  error: string | null;
};

const EMPTY_STATS: WorkStats = {
  workedDays: 0,
  projectedDays: 0,
  workedHours: 0,
  projectedHours: 0,
  pastKeys: [],
  futureKeys: [],
};

export function useWorkData(settings: Settings, settingsReady: boolean) {
  const [state, setState] = useState<WorkDataState>(() => ({
    loading: true,
    permission: true,
    configured: false,
    period: getPeriod(settings.periodStartDay),
    stats: EMPTY_STATS,
    error: null,
  }));

  const refresh = useCallback(async () => {
    const period = getPeriod(settings.periodStartDay);
    const configured = isConfigured(settings);

    setState((prev) => ({ ...prev, loading: true, error: null, period, configured }));

    if (!configured) {
      setState((prev) => ({ ...prev, loading: false, stats: EMPTY_STATS, permission: true }));
      return;
    }

    try {
      const permission = await ensureCalendarPermission();
      if (!permission) {
        setState((prev) => ({ ...prev, loading: false, permission: false, stats: EMPTY_STATS }));
        return;
      }
      const dayKeys = await fetchMatchingDayKeys(settings.searchString, settings.calendarIds, period);
      const stats = computeStats(dayKeys, settings.hoursPerDay);
      setState({ loading: false, permission: true, configured: true, period, stats, error: null });
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
