/**
 * Pure aggregation of matched work-day date keys into worked vs projected totals.
 */

import { toDateKey } from './period';

export type WorkStats = {
  /** Distinct work days with date <= today. */
  workedDays: number;
  /** All distinct work days in the period (past + future). */
  projectedDays: number;
  /** workedDays * hoursPerDay. */
  workedHours: number;
  /** projectedDays * hoursPerDay. */
  projectedHours: number;
  /** Sorted date keys with date <= today (counts as worked). */
  pastKeys: string[];
  /** Sorted date keys with date > today (scheduled, not yet worked). */
  futureKeys: string[];
};

/**
 * Splits the matched day keys around `today` (today counts as worked) and
 * multiplies day counts by `hoursPerDay`.
 */
export function computeStats(
  dayKeys: Iterable<string>,
  hoursPerDay: number,
  today: Date = new Date(),
): WorkStats {
  const todayKey = toDateKey(today);
  const past: string[] = [];
  const future: string[] = [];

  for (const key of new Set(dayKeys)) {
    if (key <= todayKey) past.push(key);
    else future.push(key);
  }
  past.sort();
  future.sort();

  const projectedDays = past.length + future.length;
  return {
    workedDays: past.length,
    projectedDays,
    workedHours: past.length * hoursPerDay,
    projectedHours: projectedDays * hoursPerDay,
    pastKeys: past,
    futureKeys: future,
  };
}
