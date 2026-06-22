/**
 * Pure date helpers for computing the active "work period".
 *
 * A period is an anchored month that starts on a configurable day-of-month
 * (`startDay`) instead of the 1st. For example, with startDay = 5 the period
 * runs from the 5th of one month through the 4th of the next. `end` is
 * exclusive (the start of the following period).
 */

export type Period = {
  /** Inclusive start, at local midnight. */
  start: Date;
  /** Exclusive end (start of the next period), at local midnight. */
  end: Date;
};

/** Number of days in the given month (month is 0-indexed). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Local midnight of the period start for a given month, clamping the start day
 * to the month's length (e.g. a startDay of 31 becomes the 28th in February).
 */
function periodStartForMonth(year: number, month: number, startDay: number): Date {
  const day = Math.min(startDay, daysInMonth(year, month));
  return new Date(year, month, day, 0, 0, 0, 0);
}

/** Clamp an arbitrary configured value into a valid day-of-month (1..31). */
export function clampStartDay(startDay: number): number {
  if (!Number.isFinite(startDay)) return 1;
  return Math.min(Math.max(Math.floor(startDay), 1), 31);
}

/**
 * Returns the period that contains `ref` for the configured `startDay`.
 */
export function getPeriod(startDay: number, ref: Date = new Date()): Period {
  const clamped = clampStartDay(startDay);
  let year = ref.getFullYear();
  let month = ref.getMonth();

  // If we're before this month's start day, the active period began last month.
  if (ref.getTime() < periodStartForMonth(year, month, clamped).getTime()) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  const start = periodStartForMonth(year, month, clamped);

  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }
  const end = periodStartForMonth(nextYear, nextMonth, clamped);

  return { start, end };
}

/** Local-time `YYYY-MM-DD` key for a date. Lexically sortable. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
