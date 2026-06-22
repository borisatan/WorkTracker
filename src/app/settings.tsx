import { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CalendarPicker } from '@/components/calendar-picker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clampStartDay } from '@/lib/period';
import { useSettings } from '@/lib/settings';

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, update } = useSettings();

  const toggleCalendar = useCallback(
    (id: string) => {
      const has = settings.calendarIds.includes(id);
      update({
        calendarIds: has
          ? settings.calendarIds.filter((c) => c !== id)
          : [...settings.calendarIds, id],
      });
    },
    [settings.calendarIds, update],
  );

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Event title contains"
          hint="Days with an event whose title contains this text count as worked.">
          <TextInput
            style={inputStyle}
            value={settings.searchString}
            onChangeText={(text) => update({ searchString: text })}
            placeholder="e.g. Work"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <Field label="Hours per work day">
          <TextInput
            style={inputStyle}
            defaultValue={String(settings.hoursPerDay)}
            onChangeText={(text) => {
              const n = parseFloat(text.replace(',', '.'));
              update({ hoursPerDay: Number.isFinite(n) && n > 0 ? n : 8 });
            }}
            keyboardType="decimal-pad"
            placeholder="8"
            placeholderTextColor={theme.textSecondary}
          />
        </Field>

        <Field
          label="Period start day"
          hint="Day of the month your period begins (1–31). Clamped to short months.">
          <TextInput
            style={inputStyle}
            defaultValue={String(settings.periodStartDay)}
            onChangeText={(text) => {
              const n = parseInt(text, 10);
              update({ periodStartDay: Number.isFinite(n) ? clampStartDay(n) : 1 });
            }}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={theme.textSecondary}
          />
        </Field>

        <Field label="Calendars to search">
          <CalendarPicker selectedIds={settings.calendarIds} onToggle={toggleCalendar} />
        </Field>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      <View style={styles.fieldControl}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  fieldControl: {
    marginTop: Spacing.one,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
});
