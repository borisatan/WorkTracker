import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Headline } from '@/components/headline';
import { ThemedText } from '@/components/themed-text';
import { WorkCalendar } from '@/components/work-calendar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWorkData } from '@/hooks/use-work-data';
import type { Period } from '@/lib/period';
import { useSettings } from '@/lib/settings';

const DAY_MS = 24 * 60 * 60 * 1000;

function formatRange(period: Period): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const last = new Date(period.end.getTime() - DAY_MS);
  return `${period.start.toLocaleDateString(undefined, opts)} – ${last.toLocaleDateString(undefined, opts)}`;
}

function GearButton() {
  const theme = useTheme();
  return (
    <Link href="/settings" asChild>
      <Pressable hitSlop={12}>
        <ThemedText style={[styles.gear, { color: theme.accent }]}>⚙︎</ThemedText>
      </Pressable>
    </Link>
  );
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { settings, ready } = useSettings();
  const { loading, permission, configured, period, stats, error, refresh } = useWorkData(settings, ready);

  // Refetch whenever the dashboard regains focus (e.g. returning from Settings).
  useFocusEffect(
    useCallback(() => {
      if (ready) refresh();
    }, [ready, refresh]),
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.accent} />}>
      <Stack.Screen options={{ headerRight: () => <GearButton /> }} />
      <SafeAreaView edges={['bottom']}>
        {!ready ? (
          <ActivityIndicator style={styles.centered} color={theme.accent} />
        ) : !configured ? (
          <EmptyState />
        ) : !permission ? (
          <Notice text="Calendar access is off. Enable it in iOS Settings, then pull to refresh." />
        ) : (
          <>
            <Headline stats={stats} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
              {formatRange(period)}
              {settings.searchString ? `  ·  “${settings.searchString.trim()}”` : ''}
            </ThemedText>
            {error ? <Notice text={error} /> : null}
            <WorkCalendar period={period} stats={stats} />
            <View style={styles.legend}>
              <LegendItem color={theme.workedDay} label="Worked" />
              <LegendItem color={theme.futureDay} label="Scheduled" />
            </View>
          </>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

function EmptyState() {
  const theme = useTheme();
  return (
    <View style={styles.centered}>
      <ThemedText type="subtitle" style={styles.centerText}>
        Set up tracking
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
        Choose a calendar and the event title to look for.
      </ThemedText>
      <Link href="/settings" asChild>
        <Pressable style={StyleSheet.flatten([styles.button, { backgroundColor: theme.accent }])}>
          <ThemedText style={styles.buttonText}>Open Settings</ThemedText>
        </Pressable>
      </Link>
    </View>
  );
}

function Notice({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  centered: {
    paddingTop: Spacing.six,
    alignItems: 'center',
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  caption: {
    textAlign: 'center',
  },
  gear: {
    fontSize: 22,
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  notice: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
