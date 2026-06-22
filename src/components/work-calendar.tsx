import { useMemo } from 'react';
import { Calendar, type CalendarProps } from 'react-native-calendars';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey, type Period } from '@/lib/period';
import type { WorkStats } from '@/lib/workdays';

type MarkedDates = NonNullable<CalendarProps['markedDates']>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Month grid for the active period. Worked days (past) and scheduled future
 * work days are colored distinctly; today gets an accent ring. Swiping is
 * limited to the months the period spans.
 */
export function WorkCalendar({ period, stats }: { period: Period; stats: WorkStats }) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const todayKey = toDateKey(new Date());
  const lastDayKey = toDateKey(new Date(period.end.getTime() - DAY_MS));

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    const fill = (keys: string[], color: string) => {
      for (const key of keys) {
        marks[key] = {
          customStyles: {
            container: { backgroundColor: color, borderRadius: 8 },
            text: { color: '#ffffff', fontWeight: '700' },
          },
        };
      }
    };
    fill(stats.pastKeys, theme.workedDay);
    fill(stats.futureKeys, theme.futureDay);

    // Today: add an accent ring, preserving any work-day fill underneath.
    const existing = marks[todayKey]?.customStyles;
    marks[todayKey] = {
      customStyles: {
        container: { ...(existing?.container ?? {}), borderWidth: 2, borderColor: theme.accent, borderRadius: 8 },
        text: existing?.text ?? { color: theme.accent, fontWeight: '700' },
      },
    };
    return marks;
  }, [stats, theme, todayKey]);

  return (
    <Calendar
      // Re-mount on theme change so the `theme` prop is re-applied.
      key={scheme}
      current={toDateKey(period.start)}
      minDate={toDateKey(period.start)}
      maxDate={lastDayKey}
      markingType="custom"
      markedDates={markedDates}
      enableSwipeMonths
      hideExtraDays
      theme={{
        calendarBackground: theme.background,
        dayTextColor: theme.text,
        monthTextColor: theme.text,
        textSectionTitleColor: theme.textSecondary,
        textDisabledColor: theme.backgroundSelected,
        todayTextColor: theme.accent,
        arrowColor: theme.accent,
      }}
      style={styles.calendar}
    />
  );
}

const styles = { calendar: { borderRadius: 16 } } as const;
