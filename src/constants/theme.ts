/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#F4F5F7',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    /** Card surface (sits above `background`). */
    card: '#FFFFFF',
    /** Subtle outline for cards. */
    cardBorder: '#E6E7EB',
    textSecondary: '#60646C',
    accent: '#208AEF',
    workedDay: '#1f9d55',
    futureDay: '#8b7cf6',
    /** Worked/scheduled days outside the active period (de-emphasized). */
    workedDayMuted: '#a7d9bd',
    futureDayMuted: '#cbc2f1',
  },
  dark: {
    text: '#ffffff',
    background: '#121316',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    /** Card surface (sits above `background`). */
    card: '#1C1E22',
    /** Subtle outline for cards. */
    cardBorder: '#2A2D33',
    textSecondary: '#B0B4BA',
    accent: '#4a9eff',
    workedDay: '#34c578',
    futureDay: '#8b7cf6',
    /** Worked/scheduled days outside the active period (de-emphasized). */
    workedDayMuted: '#1f5f3a',
    futureDayMuted: '#473d6e',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
