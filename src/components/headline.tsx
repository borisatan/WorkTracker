import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WorkStats } from '@/lib/workdays';

function dayLabel(n: number): string {
  return n === 1 ? 'day' : 'days';
}

/** Large centered worked vs projected summary (hours + days). */
export function Headline({ stats }: { stats: WorkStats }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        WORKED
      </ThemedText>
      <ThemedText style={[styles.big, { color: theme.workedDay }]}>{stats.workedHours}h</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        {stats.workedDays} {dayLabel(stats.workedDays)}
      </ThemedText>

      <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        PROJECTED
      </ThemedText>
      <ThemedText type="subtitle">{stats.projectedHours}h</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        {stats.projectedDays} {dayLabel(stats.projectedDays)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  label: {
    letterSpacing: 2,
  },
  big: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
    marginVertical: Spacing.three,
  },
});
