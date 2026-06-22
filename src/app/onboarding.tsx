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
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarPicker } from '@/components/calendar-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clampStartDay } from '@/lib/period';
import { useSettings, type Settings } from '@/lib/settings';

const ONBOARDING_KEY = 'worktracker.onboarding.v1';

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const [keyword, setKeyword] = useState(settings.searchString);
  const [hoursText, setHoursText] = useState(String(settings.hoursPerDay));
  const [startDayText, setStartDayText] = useState(String(settings.periodStartDay));

  const opacity = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const goTo = useCallback(
    (nextStep: number, patch?: Partial<Settings>) => {
      if (patch) update(patch);
      opacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setStep)(nextStep);
        opacity.value = withTiming(1, { duration: 200 });
      });
    },
    [update, opacity],
  );

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

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
    router.replace('/');
  }, [router]);

  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.splashPage}>
            <View style={styles.splashContent}>
              <ThemedText style={[styles.appName, { color: theme.accent }]}>WorkTracker</ThemedText>
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
            onNext={() => goTo(2)}
            accent={theme.accent}
            background={theme.background}
            backgroundSelected={theme.backgroundSelected}>
            <CalendarPicker selectedIds={settings.calendarIds} onToggle={toggleCalendar} />
          </SetupPage>
        );

      case 2:
        return (
          <SetupPage
            step={2}
            title="What's your work keyword?"
            hint='Events with this word in the title count as work days — e.g. "Work", "Shift", "Office".'
            onNext={() => goTo(3, { searchString: keyword.trim() })}
            accent={theme.accent}
            background={theme.background}
            backgroundSelected={theme.backgroundSelected}>
            <TextInput
              style={inputStyle}
              value={keyword}
              onChangeText={setKeyword}
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
              goTo(4, { hoursPerDay: Number.isFinite(n) && n > 0 ? n : 8 });
            }}
            accent={theme.accent}
            background={theme.background}
            backgroundSelected={theme.backgroundSelected}>
            <TextInput
              style={inputStyle}
              value={hoursText}
              onChangeText={setHoursText}
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
              goTo(5, { periodStartDay: Number.isFinite(n) ? clampStartDay(n) : 1 });
            }}
            accent={theme.accent}
            background={theme.background}
            backgroundSelected={theme.backgroundSelected}>
            <TextInput
              style={inputStyle}
              value={startDayText}
              onChangeText={setStartDayText}
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
                WorkTracker will now keep an eye on your calendar and track your hours — automatically.
              </ThemedText>
            </View>
            <Cta label="Start Tracking" onPress={finish} accent={theme.accent} />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <Animated.View style={[styles.flex, animStyle]}>{renderContent()}</Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

function SetupPage({
  step,
  title,
  hint,
  onNext,
  accent,
  background,
  backgroundSelected,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  onNext: () => void;
  accent: string;
  background: string;
  backgroundSelected: string;
  children: React.ReactNode;
}) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.setupScroll}
        keyboardShouldPersistTaps="handled">
        <ThemedText type="small" themeColor="textSecondary" style={styles.stepLabel}>
          Step {step} of 4
        </ThemedText>
        <ThemedText style={styles.setupTitle}>{title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.setupHint}>
          {hint}
        </ThemedText>
        <View style={styles.control}>{children}</View>
      </ScrollView>
      <View style={[styles.bottomBar, { backgroundColor: background }]}>
        <View style={styles.dots}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[styles.dot, { backgroundColor: s === step ? accent : backgroundSelected }]}
            />
          ))}
        </View>
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
  stepLabel: {
    marginBottom: Spacing.two,
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

  // Bottom bar for setup pages
  bottomBar: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
