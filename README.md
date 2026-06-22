# WorkTracker

An iOS app (React Native + Expo) that tracks how many hours you've worked in a
configurable monthly period by reading your Apple/iOS calendar.

A day counts as "worked" when it has an event whose title contains a string you
configure; each such day is worth a set number of hours (default 8). The
dashboard shows worked vs projected totals (hours + days) and a month calendar
with worked days and scheduled-future work days colored distinctly.

## Features

- Reads the iOS system calendar via `expo-calendar` (iCloud, Google, etc.)
- Case-insensitive title match; one match per day
- Configurable hours/day and a period that can start on any day of the month
- Worked = days up to today; Projected = all matching days in the period
- Pick which calendars to search; system light/dark theme

## Develop

Calendar access needs a custom dev build (not Expo Go):

```bash
npm install
npx expo run:ios   # builds and launches on the iOS simulator/device
npm test           # unit tests for the period + aggregation logic
```

Set the event title to match, hours/day, period start day, and calendars in the
in-app **Settings** screen.

## Project layout

- `src/app/` — screens (`index` dashboard, `settings`)
- `src/lib/` — `period`, `workdays` (pure logic), `calendar`, `settings`
- `src/components/` — `headline`, `work-calendar`, `calendar-picker`
- `src/hooks/use-work-data.ts` — fetch + aggregate orchestration
