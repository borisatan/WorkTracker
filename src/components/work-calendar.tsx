import { useMemo } from 'react';
import { Calendar, type CalendarProps } from 'react-native-calendars';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey, type Period } from '@/lib/period';

type MarkedDates = NonNullable<CalendarProps['markedDates']>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far back and forward the user can swipe. */
const RANGE_YEARS = 1;

function addYears(d: Date, years: number): Date {
  const copy = new Date(d);
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
}

/**
 * Month grid covering ±1 year. The active period is emphasized: its days use
 * the normal text color while every other day is grayed out. Worked and
 * scheduled days are colored, and those outside the active period use muted
 * shades so the current period stands out. Today gets an accent ring.
 */
export function WorkCalendar({
  period,
  workedKeys,
  scheduledKeys,
}: {
  period: Period;
  workedKeys: string[];
  scheduledKeys: string[];
}) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const today = new Date();
  const todayKey = toDateKey(today);
  const startKey = toDateKey(period.start);
  const endKey = toDateKey(period.end); // exclusive

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    const inPeriod = (key: string) => key >= startKey && key < endKey;

    // Emphasize the active period: its (otherwise unmarked) days get the full
    // text color, while the calendar's default day color is gray (see below).
    for (let t = period.start.getTime(); t < period.end.getTime(); t += DAY_MS) {
      marks[toDateKey(new Date(t))] = {
        customStyles: { text: { color: theme.text } },
      };
    }

    const fill = (keys: string[], color: string, mutedColor: string) => {
      for (const key of keys) {
        const active = inPeriod(key);
        marks[key] = {
          customStyles: {
            container: { backgroundColor: active ? color : mutedColor, borderRadius: 8 },
            text: { color: active ? '#ffffff' : theme.text, fontWeight: '700' },
          },
        };
      }
    };
    fill(workedKeys, theme.workedDay, theme.workedDayMuted);
    fill(scheduledKeys, theme.futureDay, theme.futureDayMuted);

    // Today: if it has a worked/scheduled fill already, leave it as-is.
    // Otherwise give it the workedDay fill so it matches other green days.
    if (!marks[todayKey]?.customStyles?.container?.backgroundColor) {
      const inToday = inPeriod(todayKey);
      marks[todayKey] = {
        customStyles: {
          container: { backgroundColor: inToday ? theme.workedDay : theme.workedDayMuted, borderRadius: 8 },
          text: { color: '#ffffff', fontWeight: '700' },
        },
      };
    }
    return marks;
  }, [period, startKey, endKey, workedKeys, scheduledKeys, theme, todayKey]);

  return (
    <Calendar
      // Re-mount on theme change so the `theme` prop is re-applied.
      key={scheme}
      current={todayKey}
      minDate={toDateKey(addYears(today, -RANGE_YEARS))}
      maxDate={toDateKey(addYears(today, RANGE_YEARS))}
      markingType="custom"
      markedDates={markedDates}
      enableSwipeMonths
      hideExtraDays
      theme={{
        calendarBackground: theme.card,
        // Default (out-of-period) days are grayed; in-period days are re-colored above.
        dayTextColor: theme.textSecondary,
        monthTextColor: theme.text,
        textSectionTitleColor: theme.textSecondary,
        textDisabledColor: theme.backgroundSelected,
        arrowColor: theme.accent,
      }}
      style={styles.calendar}
    />
  );
}

const styles = { calendar: { borderRadius: 16 } } as const;
