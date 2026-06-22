import { clampStartDay, getPeriod, toDateKey } from '../period';

describe('clampStartDay', () => {
  it('clamps into 1..31 and floors', () => {
    expect(clampStartDay(0)).toBe(1);
    expect(clampStartDay(-5)).toBe(1);
    expect(clampStartDay(40)).toBe(31);
    expect(clampStartDay(5.9)).toBe(5);
    expect(clampStartDay(NaN)).toBe(1);
  });
});

describe('toDateKey', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('getPeriod', () => {
  it('starts this month when ref is on/after the start day', () => {
    const { start, end } = getPeriod(5, new Date(2026, 5, 10)); // Jun 10
    expect(toDateKey(start)).toBe('2026-06-05');
    expect(toDateKey(end)).toBe('2026-07-05'); // exclusive
  });

  it('starts previous month when ref is before the start day', () => {
    const { start, end } = getPeriod(5, new Date(2026, 5, 3)); // Jun 3
    expect(toDateKey(start)).toBe('2026-05-05');
    expect(toDateKey(end)).toBe('2026-06-05');
  });

  it('includes the start day itself (boundary)', () => {
    const { start } = getPeriod(5, new Date(2026, 5, 5, 9, 0)); // Jun 5, 9am
    expect(toDateKey(start)).toBe('2026-06-05');
  });

  it('clamps a start day longer than the month (Feb, startDay 31)', () => {
    // 2026-02 has 28 days, so the period anchored at 31 starts on the 28th.
    const { start, end } = getPeriod(31, new Date(2026, 1, 28)); // Feb 28
    expect(toDateKey(start)).toBe('2026-02-28');
    expect(toDateKey(end)).toBe('2026-03-31');
  });

  it('rolls over the year boundary', () => {
    const { start, end } = getPeriod(5, new Date(2026, 0, 2)); // Jan 2
    expect(toDateKey(start)).toBe('2025-12-05');
    expect(toDateKey(end)).toBe('2026-01-05');
  });

  it('defaults startDay 1 to calendar months', () => {
    const { start, end } = getPeriod(1, new Date(2026, 5, 15));
    expect(toDateKey(start)).toBe('2026-06-01');
    expect(toDateKey(end)).toBe('2026-07-01');
  });
});
