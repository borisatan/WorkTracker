import { computeStats } from '../workdays';

const TODAY = new Date(2026, 5, 15); // 2026-06-15

describe('computeStats', () => {
  it('returns zeros for no days', () => {
    const s = computeStats([], 8, TODAY);
    expect(s).toMatchObject({ workedDays: 0, projectedDays: 0, workedHours: 0, projectedHours: 0 });
    expect(s.pastKeys).toEqual([]);
    expect(s.futureKeys).toEqual([]);
  });

  it('splits past and future around today (today counts as worked)', () => {
    const keys = ['2026-06-10', '2026-06-15', '2026-06-20'];
    const s = computeStats(keys, 8, TODAY);
    expect(s.pastKeys).toEqual(['2026-06-10', '2026-06-15']);
    expect(s.futureKeys).toEqual(['2026-06-20']);
    expect(s.workedDays).toBe(2);
    expect(s.projectedDays).toBe(3);
    expect(s.workedHours).toBe(16);
    expect(s.projectedHours).toBe(24);
  });

  it('dedupes repeated day keys', () => {
    const keys = ['2026-06-10', '2026-06-10', '2026-06-20', '2026-06-20'];
    const s = computeStats(keys, 8, TODAY);
    expect(s.workedDays).toBe(1);
    expect(s.projectedDays).toBe(2);
  });

  it('respects a custom hoursPerDay', () => {
    const s = computeStats(['2026-06-10', '2026-06-12'], 7.5, TODAY);
    expect(s.workedHours).toBe(15);
    expect(s.projectedHours).toBe(15);
  });

  it('returns sorted keys', () => {
    const s = computeStats(['2026-06-20', '2026-06-01', '2026-06-10'], 8, TODAY);
    expect(s.pastKeys).toEqual(['2026-06-01', '2026-06-10']);
    expect(s.futureKeys).toEqual(['2026-06-20']);
  });
});
