import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarPicker } from '@/components/calendar-picker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clampStartDay } from '@/lib/period';
import { useSettings } from '@/lib/settings';

const SCREEN_HEIGHT = Dimensions.get('window').height;
/** Drag distance (or flick velocity) past which the sheet dismisses. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettings();

  const close = useCallback(() => router.back(), [router]);

  const translateY = useSharedValue(0);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  // Drag the grabber/header down to dismiss; the ScrollView keeps scrolling.
  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => runOnJS(close)());
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

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
    <View style={styles.root}>
      {/* Tapping the dimmed area above the sheet closes Settings. */}
      <Pressable style={styles.backdrop} onPress={close} />

      <Animated.View style={[styles.sheet, { backgroundColor: theme.background }, sheetStyle]}>
        <GestureDetector gesture={dragGesture}>
          <View>
            <SafeAreaView edges={['top']} />
            <View style={styles.header}>
              <View style={[styles.grabber, { backgroundColor: theme.backgroundSelected }]} />
              <ThemedText type="smallBold">Settings</ThemedText>
            </View>
          </View>
        </GestureDetector>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Field
              label="Work keyword"
              hint='A day counts as worked when one of its calendar events has this word in its title (e.g. type "Work" to match an event called "Work shift").'>
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

            <Field label="Hours per work day" hint="How many hours you work per day.">
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
              label="Pay period start day"
              hint="The day of the month your pay period begins (1–31). Totals reset on this day. Months shorter than this use their last day.">
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

            <Field
              label="Calendars to check"
              hint="Pick which of your phone's calendars to search for work events. These are the calendars from your Calendar app — like your personal, work, or subscribed calendars.">
              <CalendarPicker selectedIds={settings.calendarIds} onToggle={toggleCalendar} />
            </Field>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
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
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    flex: 1,
    marginTop: Spacing.six,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    overflow: 'hidden',
  },
  header: {
    paddingBottom: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
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
