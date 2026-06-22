import EventKit
import Foundation

/// App Group shared with the React Native app. Must match the identifier in
/// app.json and expo-target.config.js.
enum AppGroup {
    static let identifier = "group.com.worktracker.app"
}

/// Settings mirrored from the RN app's AsyncStorage into the shared App Group.
/// Keys/types must match what `src/lib/widget-sync.ts` writes.
struct WorkSettings {
    var searchString: String
    var calendarIds: [String]
    var hoursPerDay: Double
    var periodStartDay: Int

    static func load() -> WorkSettings {
        let defaults = UserDefaults(suiteName: AppGroup.identifier)
        let search = defaults?.string(forKey: "searchString") ?? ""
        // calendarIds is written as a JSON string by src/lib/widget-sync.ts.
        let idsJSON = defaults?.string(forKey: "calendarIds") ?? "[]"
        let ids = (try? JSONSerialization.jsonObject(with: Data(idsJSON.utf8))) as? [String] ?? []
        // hoursPerDay is stored as a string so fractional values survive.
        let hours = Double(defaults?.string(forKey: "hoursPerDay") ?? "") ?? 8
        let rawStartDay = defaults?.integer(forKey: "periodStartDay") ?? 0
        return WorkSettings(
            searchString: search,
            calendarIds: ids,
            hoursPerDay: hours,
            periodStartDay: rawStartDay == 0 ? 1 : rawStartDay
        )
    }

    /// Mirrors `isConfigured` in src/lib/settings.tsx.
    var isConfigured: Bool {
        !searchString.trimmingCharacters(in: .whitespaces).isEmpty && !calendarIds.isEmpty
    }
}

/// An anchored month that starts on `periodStartDay`. `end` is exclusive.
/// Port of src/lib/period.ts.
struct WorkPeriod {
    let start: Date
    let end: Date
}

enum Period {
    static func clampStartDay(_ startDay: Int) -> Int {
        return min(max(startDay, 1), 31)
    }

    /// Local midnight of the period start for a given (1-indexed) month,
    /// clamping the start day to the month's length.
    static func startForMonth(year: Int, month: Int, startDay: Int, calendar: Calendar) -> Date {
        var comps = DateComponents()
        comps.year = year
        comps.month = month
        comps.day = 1
        let firstOfMonth = calendar.date(from: comps)!
        let daysInMonth = calendar.range(of: .day, in: .month, for: firstOfMonth)!.count
        comps.day = min(startDay, daysInMonth)
        return calendar.startOfDay(for: calendar.date(from: comps)!)
    }

    /// Returns the period that contains `ref`.
    static func current(startDay: Int, ref: Date, calendar: Calendar) -> WorkPeriod {
        let clamped = clampStartDay(startDay)
        var year = calendar.component(.year, from: ref)
        var month = calendar.component(.month, from: ref) // 1-indexed

        // If we're before this month's start day, the period began last month.
        if ref < startForMonth(year: year, month: month, startDay: clamped, calendar: calendar) {
            month -= 1
            if month < 1 {
                month = 12
                year -= 1
            }
        }

        let start = startForMonth(year: year, month: month, startDay: clamped, calendar: calendar)

        var nextYear = year
        var nextMonth = month + 1
        if nextMonth > 12 {
            nextMonth = 1
            nextYear += 1
        }
        let end = startForMonth(year: nextYear, month: nextMonth, startDay: clamped, calendar: calendar)

        return WorkPeriod(start: start, end: end)
    }
}

/// Worked vs projected totals for the active period. Port of src/lib/workdays.ts.
struct WorkSummary {
    var workedDays: Int
    var projectedDays: Int
    var workedHours: Double
    var projectedHours: Double
}

/// What the widget renders. Distinguishes the empty / no-permission states so we
/// can show a helpful message instead of zeros.
enum WidgetState {
    case ready(WorkSummary, WorkPeriod)
    case notConfigured
    case noAccess
}

enum WorkData {
    /// Reads the calendar live and aggregates the active period, mirroring the
    /// RN app's pipeline: match event titles -> distinct days -> split around
    /// today -> multiply by hoursPerDay.
    static func compute(now: Date = Date()) -> WidgetState {
        let settings = WorkSettings.load()
        guard settings.isConfigured else { return .notConfigured }

        // Deployment target is iOS 17, where read access is `.fullAccess`.
        guard EKEventStore.authorizationStatus(for: .event) == .fullAccess else {
            return .noAccess
        }

        let calendar = Calendar.current
        let period = Period.current(startDay: settings.periodStartDay, ref: now, calendar: calendar)

        let store = EKEventStore()
        let selected = store.calendars(for: .event)
            .filter { settings.calendarIds.contains($0.calendarIdentifier) }
        guard !selected.isEmpty else {
            return .ready(WorkSummary(workedDays: 0, projectedDays: 0, workedHours: 0, projectedHours: 0), period)
        }

        let predicate = store.predicateForEvents(withStart: period.start, end: period.end, calendars: selected)
        let events = store.events(matching: predicate)

        let needle = settings.searchString.trimmingCharacters(in: .whitespaces).lowercased()
        var days = Set<Date>()
        for event in events {
            guard let title = event.title?.lowercased(), title.contains(needle) else { continue }
            days.insert(calendar.startOfDay(for: event.startDate))
        }

        let today = calendar.startOfDay(for: now)
        var workedDays = 0
        for day in days where day <= today {
            workedDays += 1
        }
        let projectedDays = days.count

        let summary = WorkSummary(
            workedDays: workedDays,
            projectedDays: projectedDays,
            workedHours: Double(workedDays) * settings.hoursPerDay,
            projectedHours: Double(projectedDays) * settings.hoursPerDay
        )
        return .ready(summary, period)
    }
}
