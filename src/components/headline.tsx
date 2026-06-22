import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WorkStats } from '@/lib/workdays';

function dayLabel(n: number): string {
  return n === 1 ? 'day' : 'days';
}

/** Worked vs projected summary (hours + days), shown side by side. */
export function Headline({ stats }: { stats: WorkStats }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Stat
        label="WORKED"
        hours={stats.workedHours}
        days={stats.workedDays}
        color={theme.workedDay}
      />
      <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
      <Stat label="PROJECTED" hours={stats.projectedHours} days={stats.projectedDays} />
    </View>
  );
}

function Stat({
  label,
  hours,
  days,
  color,
}: {
  label: string;
  hours: number;
  days: number;
  color?: string;
}) {
  return (
    <View style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.big, color ? { color } : null]}>{hours}h</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        {days} {dayLabel(days)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  label: {
    letterSpacing: 2,
  },
  big: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: Spacing.two,
  },
});
