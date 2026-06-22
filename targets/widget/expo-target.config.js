/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "WorkTrackerWidget",
  displayName: "Work Tracker",
  // iOS 17 is the floor for home-screen widgets that use `containerBackground`.
  deploymentTarget: "17.0",
  // EventKit lets the widget read the calendar live; WidgetKit/SwiftUI come for free.
  frameworks: ["EventKit"],
  // Must match the App Group declared on the main app in app.json so both
  // processes read/write the same UserDefaults suite.
  entitlements: {
    "com.apple.security.application-groups": ["group.com.worktracker.app"],
  },
  // Mirrors the app's theme so the widget matches light/dark. Available in
  // Swift as `Color("worked")` / `Color("accent")`.
  colors: {
    worked: { light: "#1f9d55", dark: "#34c578" },
    accent: { light: "#208AEF", dark: "#4a9eff" },
    // Card surface, mirrors `card` in src/constants/theme.ts. Resolved via the
    // (possibly forced) SwiftUI colorScheme so the widget can match the app's
    // manual dark-mode override, not just the system appearance.
    widgetBackground: { light: "#FFFFFF", dark: "#1C1E22" },
  },
};
