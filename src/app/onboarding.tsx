import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarPicker } from '@/components/calendar-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { clampStartDay } from '@/lib/period';
import { saveSettings, useSettings, type Settings } from '@/lib/settings';

const ONBOARDING_KEY = 'cadenza.onboarding.v1';

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const [keyword, setKeyword] = useState(settings.searchString);
  const [hoursText, setHoursText] = useState(String(settings.hoursPerDay));
  const [startDayText, setStartDayText] = useState(String(settings.periodStartDay));
  const [fieldError, setFieldError] = useState('');
  // null = not yet resolved, false = denied, true = granted
  const [calendarPermission, setCalendarPermission] = useState<boolean | null>(null);

  const goTo = useCallback(
    (nextStep: number, patch?: Partial<Settings>) => {
      if (patch) update(patch);
      setFieldError('');
      setStep(nextStep);
    },
    [update],
  );

  const toggleCalendar = useCallback(
    (id: string) => {
      const has = settings.calendarIds.includes(id);
      setFieldError('');
      update({
        calendarIds: has
          ? settings.calendarIds.filter((c) => c !== id)
          : [...settings.calendarIds, id],
      });
    },
    [settings.calendarIds, update],
  );

  const finish = useCallback(async () => {
    await saveSettings(settings);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
    router.replace('/');
  }, [router, settings]);

  const inputStyle = [
    styles.input,
    isDark
      ? { backgroundColor: theme.background, color: theme.text, borderWidth: 1, borderColor: theme.backgroundSelected }
      : { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.splashPage}>
            <View style={styles.splashContent}>
              <ThemedText style={[styles.appName, { color: theme.accent }]}>Cadenza</ThemedText>
              <ThemedText style={styles.splashTitle}>
                Never forget how many hours you've worked this month again.
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.splashSub}>
                Takes less than a minute to set up.
              </ThemedText>
            </View>
            <Cta label="Get Started" onPress={() => goTo(1)} accent={theme.accent} />
          </View>
        );

      case 1:
        return (
          <SetupPage
            step={1}
            title="Which calendars should we check?"
            hint="Pick the calendars where your work shifts or meetings appear."
            onNext={() => {
              if (calendarPermission === null) return;
              if (!calendarPermission) {
                setFieldError('Calendar access is required. Enable it in iOS Settings and come back.');
                return;
              }
              if (settings.calendarIds.length === 0) {
                setFieldError('Please select at least one calendar.');
                return;
              }
              goTo(2);
            }}
            accent={theme.accent}
            background={theme.background}
            error={fieldError}>
            <CalendarPicker
              selectedIds={settings.calendarIds}
              onToggle={toggleCalendar}
              onPermissionChange={setCalendarPermission}
            />
          </SetupPage>
        );

      case 2:
        return (
          <SetupPage
            step={2}
            title="What's your work keyword?"
            hint='Events with this word in the title count as work days — e.g. "Work", "Shift", "Office".'
            onNext={() => {
              if (keyword.trim().length === 0) {
                setFieldError('Please enter a keyword to match your work events.');
                return;
              }
              goTo(3, { searchString: keyword.trim() });
            }}
            accent={theme.accent}
            background={theme.background}
            error={fieldError}>
            <TextInput
              style={inputStyle}
              value={keyword}
              onChangeText={(t) => { setKeyword(t); setFieldError(''); }}
              placeholder="e.g. Work"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </SetupPage>
        );

      case 3:
        return (
          <SetupPage
            step={3}
            title="How many hours per work day?"
            hint="We'll multiply this by your worked days to calculate your total hours."
            onNext={() => {
              const n = parseFloat(hoursText.replace(',', '.'));
              if (!Number.isFinite(n) || n <= 0) {
                setFieldError('Please enter a valid number of hours, e.g. 8 or 7.5.');
                return;
              }
              goTo(4, { hoursPerDay: n });
            }}
            accent={theme.accent}
            background={theme.background}
            error={fieldError}>
            <TextInput
              style={inputStyle}
              value={hoursText}
              onChangeText={(t) => { setHoursText(t); setFieldError(''); }}
              keyboardType="decimal-pad"
              placeholder="8"
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />
          </SetupPage>
        );

      case 4:
        return (
          <SetupPage
            step={4}
            title="When does your pay period start?"
            hint="Enter the day of the month your period resets — e.g. 1 for the 1st, 15 for the 15th."
            onNext={() => {
              const n = parseInt(startDayText, 10);
              if (!Number.isFinite(n) || n < 1 || n > 31) {
                setFieldError('Please enter a day between 1 and 31.');
                return;
              }
              goTo(5, { periodStartDay: clampStartDay(n) });
            }}
            accent={theme.accent}
            background={theme.background}
            error={fieldError}>
            <TextInput
              style={inputStyle}
              value={startDayText}
              onChangeText={(t) => { setStartDayText(t); setFieldError(''); }}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />
          </SetupPage>
        );

      case 5:
        return (
          <View style={styles.splashPage}>
            <View style={styles.splashContent}>
              <ThemedText style={styles.splashTitle}>You're all set!</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.splashSub}>
                Cadenza will now keep an eye on your calendar and track your hours — automatically.
              </ThemedText>
            </View>
            <Cta label="Start Tracking" onPress={finish} accent={theme.accent} />
          </View>
        );

      default:
        return null;
    }
  };

  const showProgress = step >= 1 && step <= TOTAL_STEPS;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {showProgress && (
          <ProgressBar
            current={step}
            total={TOTAL_STEPS}
            accent={theme.accent}
            backgroundSelected={theme.backgroundSelected}
          />
        )}
        <View style={styles.flex}>{renderContent()}</View>
      </SafeAreaView>
    </ThemedView>
  );
}

function ProgressBar({
  current,
  total,
  accent,
  backgroundSelected,
}: {
  current: number;
  total: number;
  accent: string;
  backgroundSelected: string;
}) {
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressTrack, { backgroundColor: backgroundSelected }]}>
        <View style={[styles.progressFill, { width: `${(current / total) * 100}%`, backgroundColor: accent }]} />
      </View>
    </View>
  );
}

function SetupPage({
  step,
  title,
  hint,
  onNext,
  accent,
  background,
  error,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  onNext: () => void;
  accent: string;
  background: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.setupScroll}
        keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.setupTitle}>{title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.setupHint}>
          {hint}
        </ThemedText>
        <View style={styles.control}>{children}</View>
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      </ScrollView>
      <View style={[styles.bottomBar, { backgroundColor: background }]}>
        <Cta label="Next" onPress={onNext} accent={accent} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Cta({ label, onPress, accent }: { label: string; onPress: () => void; accent: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cta, { backgroundColor: accent, opacity: pressed ? 0.8 : 1 }]}>
      <ThemedText style={styles.ctaText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  // Progress bar
  progressContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    alignItems: 'center',
  },
  progressTrack: {
    width: '30%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Splash pages (welcome + all set)
  splashPage: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  appName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  splashTitle: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 50,
    fontFamily: Fonts?.rounded,
  },
  splashSub: {
    fontSize: 17,
    lineHeight: 26,
  },

  // Setup pages
  setupScroll: {
    padding: Spacing.four,
    paddingBottom: 160,
  },
  setupTitle: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    marginBottom: Spacing.two,
  },
  setupHint: {
    fontSize: 15,
    lineHeight: 22,
  },
  control: {
    marginTop: Spacing.four,
  },
  errorText: {
    marginTop: Spacing.two,
    fontSize: 13,
    color: '#e53e3e',
  },

  // Bottom bar for setup pages
  bottomBar: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },

  // CTA button
  cta: {
    paddingVertical: 16,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },

  // Text input
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
});
