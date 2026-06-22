import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ensureCalendarPermission, listDeviceCalendars, type DeviceCalendar } from '@/lib/calendar';

type Props = {
  selectedIds: string[];
  onToggle: (id: string) => void;
};

/** Multi-select list of the device's event calendars. */
export function CalendarPicker({ selectedIds, onToggle }: Props) {
  const theme = useTheme();
  const [calendars, setCalendars] = useState<DeviceCalendar[] | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const granted = await ensureCalendarPermission();
    setPermission(granted);
    if (granted) setCalendars(await listDeviceCalendars());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (permission === null) {
    return <ActivityIndicator style={styles.loader} color={theme.accent} />;
  }

  if (!permission) {
    return (
      <Pressable
        onPress={load}
        style={[styles.permissionRow, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Calendar access is required. Tap to grant, or enable it in Settings.
        </ThemedText>
      </Pressable>
    );
  }

  if (calendars && calendars.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No calendars found on this device.
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {calendars?.map((cal) => {
        const selected = selectedIds.includes(cal.id);
        return (
          <Pressable
            key={cal.id}
            onPress={() => onToggle(cal.id)}
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.dot, { backgroundColor: cal.color ?? theme.accent }]} />
            <View style={styles.rowText}>
              <ThemedText type="default">{cal.title}</ThemedText>
              {cal.source ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {cal.source}
                </ThemedText>
              ) : null}
            </View>
            <View
              style={[
                styles.check,
                { borderColor: selected ? theme.accent : theme.backgroundSelected },
                selected && { backgroundColor: theme.accent },
              ]}>
              {selected ? <ThemedText style={styles.checkMark}>✓</ThemedText> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: {
    flex: 1,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  permissionRow: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
