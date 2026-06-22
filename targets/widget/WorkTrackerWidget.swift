import WidgetKit
import SwiftUI

struct WorkEntry: TimelineEntry {
    let date: Date
    let state: WidgetState
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WorkEntry {
        WorkEntry(date: Date(), state: .ready(
            WorkSummary(workedDays: 12, projectedDays: 20, workedHours: 96, projectedHours: 160),
            Period.current(startDay: 1, ref: Date(), calendar: .current)
        ))
    }

    func getSnapshot(in context: Context, completion: @escaping (WorkEntry) -> Void) {
        completion(WorkEntry(date: Date(), state: WorkData.compute()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WorkEntry>) -> Void) {
        let now = Date()
        let entry = WorkEntry(date: now, state: WorkData.compute(now: now))
        // The numbers change at most daily; refresh hourly. The app also pushes
        // an immediate reload when settings change.
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: now) ?? now.addingTimeInterval(3600)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Formatting

private func formatHours(_ hours: Double) -> String {
    if hours == hours.rounded() {
        return "\(Int(hours))h"
    }
    return String(format: "%.1fh", hours)
}

private func dayLabel(_ count: Int) -> String {
    return count == 1 ? "1 day" : "\(count) days"
}

/// Compact label for the active period, e.g. "Jun 1–30" or "Jun 15 – Jul 14".
private func periodLabel(_ period: WorkPeriod) -> String {
    let calendar = Calendar.current
    let lastDay = calendar.date(byAdding: .day, value: -1, to: period.end) ?? period.start

    let month = DateFormatter()
    month.dateFormat = "MMM"
    let startMonth = calendar.component(.month, from: period.start)
    let endMonth = calendar.component(.month, from: lastDay)
    let startDay = calendar.component(.day, from: period.start)
    let endDayNum = calendar.component(.day, from: lastDay)

    if startMonth == endMonth {
        return "\(month.string(from: period.start)) \(startDay)–\(endDayNum)"
    }
    return "\(month.string(from: period.start)) \(startDay) – \(month.string(from: lastDay)) \(endDayNum)"
}

// MARK: - Views

/// A single stat column: label, big hours, day count.
struct StatColumn: View {
    let label: String
    let hours: Double
    let days: Int
    var emphasized: Bool = false
    var hoursFont: Font = .system(size: 34, weight: .heavy, design: .rounded)

    var body: some View {
        VStack(alignment: .center, spacing: 2) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.5)
                .foregroundStyle(.secondary)
            Text(formatHours(hours))
                .font(hoursFont)
                .foregroundStyle(emphasized ? Color("worked") : Color.primary)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            Text(dayLabel(days))
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
        }
    }
}

struct MessageView: View {
    let title: String
    let subtitle: String
    var body: some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.system(size: 15, weight: .bold))
                .multilineTextAlignment(.center)
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 8)
    }
}

struct SmallView: View {
    let summary: WorkSummary
    let period: WorkPeriod

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(periodLabel(period))
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            VStack(alignment: .leading, spacing: 0) {
                Text("WORKED")
                    .font(.system(size: 10, weight: .semibold))
                    .tracking(1.5)
                    .foregroundStyle(.secondary)
                Text(formatHours(summary.workedHours))
                    .font(.system(size: 40, weight: .heavy, design: .rounded))
                    .foregroundStyle(Color("worked"))
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                Text(dayLabel(summary.workedDays))
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)

            Text("of \(formatHours(summary.projectedHours)) · \(dayLabel(summary.projectedDays))")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct MediumView: View {
    let summary: WorkSummary
    let period: WorkPeriod

    var body: some View {
        VStack(spacing: 8) {
            Text(periodLabel(period))
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 0) {
                StatColumn(label: "WORKED", hours: summary.workedHours, days: summary.workedDays, emphasized: true)
                    .frame(maxWidth: .infinity)
                Rectangle()
                    .fill(Color.secondary.opacity(0.25))
                    .frame(width: 1)
                    .padding(.vertical, 4)
                StatColumn(label: "PROJECTED", hours: summary.projectedHours, days: summary.projectedDays)
                    .frame(maxWidth: .infinity)
            }
            .frame(maxHeight: .infinity)
        }
    }
}

struct WorkTrackerWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: Provider.Entry

    var body: some View {
        content
            .containerBackground(for: .widget) { Color(uiColor: .systemBackground) }
            .widgetURL(URL(string: "worktracker://"))
    }

    @ViewBuilder
    private var content: some View {
        switch entry.state {
        case .notConfigured:
            MessageView(title: "Set up tracking", subtitle: "Open Work Tracker to pick a calendar and event title.")
        case .noAccess:
            MessageView(title: "Calendar access off", subtitle: "Enable calendar access for Work Tracker in Settings.")
        case let .ready(summary, period):
            switch family {
            case .systemSmall:
                SmallView(summary: summary, period: period)
            default:
                MediumView(summary: summary, period: period)
            }
        }
    }
}

struct WorkTrackerWidget: Widget {
    let kind: String = "WorkTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WorkTrackerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Work Tracker")
        .description("Hours worked and projected for the current period.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
