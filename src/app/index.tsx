import { SymbolView } from 'expo-symbols';
import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { Headline } from '@/components/headline';
import { ThemedText } from '@/components/themed-text';
import { WorkCalendar } from '@/components/work-calendar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWorkData } from '@/hooks/use-work-data';
import { useSettings } from '@/lib/settings';
import { useThemePreference } from '@/lib/theme-preference';

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

function ThemeToggleButton() {
  const theme = useTheme();
  const { scheme, toggle } = useThemePreference();
  const dark = scheme === 'dark';
  return (
    <Pressable hitSlop={12} onPress={toggle} accessibilityLabel="Toggle dark mode">
      <SymbolView
        name={dark ? 'sun.max.fill' : 'moon.fill'}
        size={22}
        tintColor={theme.accent}
        fallback={<ThemedText style={[styles.gear, { color: theme.accent }]}>{dark ? '☀︎' : '☾'}</ThemedText>}
      />
    </Pressable>
  );
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { settings, ready } = useSettings();
  const { loading, permission, configured, period, stats, workedKeys, scheduledKeys, error, refresh } =
    useWorkData(settings, ready);

  // Refetch whenever the dashboard regains focus (e.g. returning from Settings).
  useFocusEffect(
    useCallback(() => {
      if (ready) refresh(true);
    }, [ready, refresh]),
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.accent} />}>
      <Stack.Screen
        options={{ headerLeft: () => <ThemeToggleButton />, headerRight: () => <GearButton /> }}
      />
      <SafeAreaView edges={['bottom']}>
        {!ready ? (
          <ActivityIndicator style={styles.centered} color={theme.accent} />
        ) : !configured ? (
          <EmptyState />
        ) : !permission ? (
          <Notice text="Calendar access is off. Enable it in iOS Settings, then pull to refresh." />
        ) : (
          <>
            <Card>
              <Headline stats={stats} />
            </Card>
            {error ? <Notice text={error} /> : null}
            <Card style={styles.calendarCard}>
              <WorkCalendar period={period} workedKeys={workedKeys} scheduledKeys={scheduledKeys} />
              <View style={styles.legend}>
                <LegendItem color={theme.workedDay} label="Worked" />
                <LegendItem color={theme.futureDay} label="Scheduled" />
              </View>
            </Card>
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
  return (
    <Card>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </Card>
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
  calendarCard: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingBottom: Spacing.two,
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
