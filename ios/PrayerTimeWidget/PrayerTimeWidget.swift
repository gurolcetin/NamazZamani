import SwiftUI
import WidgetKit

private enum WidgetStorage {
  static let appGroupIdentifier = "group.com.gmsac.namazdefteri"
  static let snapshotKey = "prayer_widget_snapshot"
  static let kind = "PrayerTimeCountdownWidget"
}

private let prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]

struct PrayerWidgetTheme: Decodable {
  let primary: String?
  let cardBackground: String?
  let textColor: String?
  let mutedTextColor: String?
  let borderColor: String?
}

struct PrayerWidgetSnapshot: Decodable {
  let timings: [String: String]
  let locationLabel: String?
  let utcLabel: String?
  let sequenceBaseDate: String?
  let labels: [String: String]?
  let theme: PrayerWidgetTheme?
  let savedAt: String?
}

struct PrayerSequenceItem: Hashable {
  let key: String
  let label: String
  let time: String
  let date: Date
}

struct PrayerWidgetEntry: TimelineEntry {
  let date: Date
  let snapshot: PrayerWidgetSnapshot?
  let next: PrayerSequenceItem?
  let upcoming: [PrayerSequenceItem]
  let dailyPrayers: [PrayerSequenceItem]
}

struct PrayerTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerWidgetEntry {
    makeEntry(date: Date(), snapshot: PrayerWidgetSnapshot.sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerWidgetEntry) -> Void) {
    completion(makeEntry(date: Date(), snapshot: loadSnapshot() ?? PrayerWidgetSnapshot.sample))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerWidgetEntry>) -> Void) {
    let now = Date()
    let entry = makeEntry(date: now, snapshot: loadSnapshot())
    let refreshDate = Calendar.current.date(byAdding: .minute, value: 1, to: now) ?? now.addingTimeInterval(60)
    completion(Timeline(entries: [entry], policy: .after(refreshDate)))
  }

  private func loadSnapshot() -> PrayerWidgetSnapshot? {
    guard
      let defaults = UserDefaults(suiteName: WidgetStorage.appGroupIdentifier),
      let json = defaults.string(forKey: WidgetStorage.snapshotKey),
      let data = json.data(using: .utf8)
    else {
      return nil
    }

    return try? JSONDecoder().decode(PrayerWidgetSnapshot.self, from: data)
  }

  private func makeEntry(date: Date, snapshot: PrayerWidgetSnapshot?) -> PrayerWidgetEntry {
    let sequence = snapshot.map { buildSequence(snapshot: $0, now: date) } ?? []
    let next = sequence.first { date < $0.date }
    let upcoming = sequence.filter { date < $0.date }.prefix(6)
    let dailyPrayers = snapshot.map { buildDailyPrayers(snapshot: $0, now: date) } ?? []
    return PrayerWidgetEntry(
      date: date,
      snapshot: snapshot,
      next: next,
      upcoming: Array(upcoming),
      dailyPrayers: dailyPrayers
    )
  }
}

struct PrayerTimeWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: PrayerWidgetEntry

  var body: some View {
    Group {
      switch family {
      case .systemMedium:
        mediumView
      default:
        smallView
      }
    }
    .widgetBackground(family == .systemSmall ? AnyView(Color.white) : AnyView(backgroundGradient))
  }

  private var primaryColor: Color {
    Color(hex: entry.snapshot?.theme?.primary, fallback: Color(red: 0.11, green: 0.72, blue: 0.62))
  }

  private var backgroundGradient: some View {
    LinearGradient(
      colors: [
        primaryColor,
        Color(red: 0.07, green: 0.54, blue: 0.62)
      ],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  private var smallView: some View {
    ZStack(alignment: .top) {
      Color.white
      backgroundGradient
        .frame(maxWidth: .infinity)
        .frame(height: 54)

      VStack(spacing: 0) {
        iconLocationHeader(fontSize: 15, iconSize: 16, color: .white)
          .padding(.horizontal, 16)
          .frame(height: 54)
          .offset(y: 3)

        if let next = entry.next {
          VStack(spacing: 0) {
            Spacer(minLength: 4)

            Text(next.label)
              .font(.system(size: 18, weight: .semibold))
              .foregroundStyle(.black)
              .lineLimit(1)
              .minimumScaleFactor(0.72)

            Text(next.time)
              .font(.system(size: 34, weight: .bold, design: .rounded))
              .foregroundStyle(.black)
              .monospacedDigit()
              .lineLimit(1)
              .minimumScaleFactor(0.68)

            Rectangle()
              .fill(Color.black.opacity(0.13))
              .frame(height: 1)
              .padding(.horizontal, 20)
              .padding(.vertical, 5)

            HStack(spacing: 6) {
              Image(systemName: "clock")
                .font(.system(size: 11, weight: .semibold))
              Text("Kalan Sure")
                .font(.system(size: 12, weight: .medium))
            }
            .foregroundStyle(.black.opacity(0.82))

            countdownText(to: next.date)
              .font(.system(size: 20, weight: .bold, design: .rounded))
              .foregroundStyle(.black)
              .monospacedDigit()
              .lineLimit(1)
              .minimumScaleFactor(0.62)
              .frame(maxWidth: .infinity, alignment: .center)
              .padding(.top, 1)

            Spacer(minLength: 12)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
          emptyState
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
      }
      .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  private var mediumView: some View {
    HStack(spacing: 10) {
      VStack(alignment: .leading, spacing: 0) {
        iconLocationHeader(fontSize: 15, iconSize: 17, color: .white.opacity(0.86))

        Spacer(minLength: 11)

        if let next = entry.next {
          Text(next.label)
            .font(.system(size: 21, weight: .semibold))
            .foregroundStyle(.white)
            .lineLimit(1)
            .minimumScaleFactor(0.75)

          Text(next.time)
            .font(.system(size: 48, weight: .bold, design: .rounded))
            .foregroundStyle(.white)
            .monospacedDigit()
            .lineLimit(1)
            .minimumScaleFactor(0.62)
            .padding(.top, 3)

          Spacer(minLength: 10)

          HStack(spacing: 8) {
            Image(systemName: "clock")
              .font(.system(size: 16, weight: .semibold))
              .foregroundStyle(.white.opacity(0.75))
            VStack(alignment: .leading, spacing: 3) {
              Text("Kalan Sure")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.86))

              countdownText(to: next.date)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.68)
            }
          }

        } else {
          emptyState
            .foregroundStyle(.white)
        }

        Spacer(minLength: 0)
      }
      .frame(maxWidth: .infinity, alignment: .leading)

      LazyVGrid(
        columns: [
          GridItem(.flexible(), spacing: 6),
          GridItem(.flexible(), spacing: 6)
        ],
        spacing: 6
      ) {
        ForEach(mediumPrayerItems, id: \.self) { item in
          mediumPrayerCard(item)
        }
      }
      .frame(width: 190)
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 17)
  }

  private var header: some View {
    HStack(alignment: .top, spacing: 8) {
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.snapshot?.locationLabel?.nilIfEmpty ?? "Namaz Defteri")
          .font(.system(size: 17, weight: .bold))
          .foregroundStyle(.white)
          .lineLimit(1)
          .minimumScaleFactor(0.7)

        Text("Sonraki Vakit")
          .font(.system(size: 12, weight: .medium))
          .foregroundStyle(.white.opacity(0.82))
      }

      Spacer(minLength: 4)

      Image(systemName: "moon.stars.fill")
        .font(.system(size: 18, weight: .semibold))
        .foregroundStyle(.white)
    }
  }

  private var locationHeader: some View {
    Text(entry.snapshot?.locationLabel?.nilIfEmpty ?? "Namaz Defteri")
      .font(.system(size: 15, weight: .bold))
      .foregroundStyle(.white)
      .lineLimit(1)
      .minimumScaleFactor(0.62)
      .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func iconLocationHeader(fontSize: CGFloat, iconSize: CGFloat, color: Color) -> some View {
    HStack(spacing: 7) {
      Image(systemName: "location.fill")
        .font(.system(size: iconSize, weight: .semibold))
        .foregroundStyle(color)

      Text(entry.snapshot?.locationLabel?.nilIfEmpty ?? "Namaz Defteri")
        .font(.system(size: fontSize, weight: .bold))
        .foregroundStyle(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.58)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func mediumPrayerCard(_ item: PrayerSequenceItem) -> some View {
    HStack(spacing: 5) {
      Image(systemName: prayerIconName(for: item.key))
        .font(.system(size: 14, weight: .regular))
        .foregroundStyle(.black.opacity(0.82))
        .frame(width: 16)

      VStack(alignment: .leading, spacing: 0) {
        Text(item.label)
          .font(.system(size: 10, weight: .medium))
          .lineLimit(1)
          .minimumScaleFactor(0.5)
          .allowsTightening(true)

        Text(item.time)
          .font(.system(size: 14, weight: .bold, design: .rounded))
          .monospacedDigit()
          .lineLimit(1)
          .minimumScaleFactor(0.5)
          .allowsTightening(true)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .foregroundStyle(.black.opacity(0.9))
    .padding(.horizontal, 6)
    .frame(maxWidth: .infinity, minHeight: 42, alignment: .leading)
    .background(Color.white.opacity(0.90), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
  }

  private func prayerIconName(for key: String) -> String {
    switch key {
    case "Fajr", "Maghrib":
      return "sunrise"
    case "Sunrise", "Dhuhr":
      return "sun.max"
    case "Asr":
      return "cloud.sun"
    case "Isha":
      return "moon"
    default:
      return "clock"
    }
  }

  private var mediumPrayerItems: [PrayerSequenceItem] {
    if !entry.dailyPrayers.isEmpty {
      return entry.dailyPrayers
    }
    return Array(entry.upcoming.prefix(6))
  }

  private var emptyState: some View {
    VStack(spacing: 6) {
      Image(systemName: "clock.badge.exclamationmark")
        .font(.system(size: 23, weight: .semibold))
      Text("Vakit bilgisi yok")
        .font(.system(size: 15, weight: .semibold))
      Text("Uygulamayi acin")
        .font(.system(size: 12, weight: .medium))
        .opacity(0.72)
    }
    .foregroundStyle(.black.opacity(0.78))
    .multilineTextAlignment(.center)
  }

  private func countdownText(to date: Date) -> Text {
    if date > entry.date {
      return Text(date, style: .timer)
    }
    return Text("00:00")
  }
}

struct PrayerTimeCountdownWidget: Widget {
  let kind = WidgetStorage.kind

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTimelineProvider()) { entry in
      PrayerTimeWidgetView(entry: entry)
    }
    .configurationDisplayName("Namaz Vakti")
    .description("Sıradaki namaz vaktini ve kalan süreyi gösterir.")
    .supportedFamilies([.systemSmall, .systemMedium])
    .contentMarginsDisabled()
  }
}

@main
struct PrayerTimeWidgetBundle: WidgetBundle {
  var body: some Widget {
    PrayerTimeCountdownWidget()
  }
}

private func buildSequence(snapshot: PrayerWidgetSnapshot, now: Date) -> [PrayerSequenceItem] {
  var result: [PrayerSequenceItem] = []
  for dayOffset in 0...1 {
    guard let day = Calendar.current.date(byAdding: .day, value: dayOffset, to: startOfDay(now)) else {
      continue
    }

    for key in prayerOrder {
      guard
        let time = snapshot.timings[key],
        let date = dateForPrayerTime(time, on: day)
      else {
        continue
      }

      result.append(
        PrayerSequenceItem(
          key: key,
          label: snapshot.labels?[key] ?? defaultPrayerLabel(for: key),
          time: cleanClock(time),
          date: date
        )
      )
    }
  }

  return result.sorted { $0.date < $1.date }
}

private func buildDailyPrayers(snapshot: PrayerWidgetSnapshot, now: Date) -> [PrayerSequenceItem] {
  let today = startOfDay(now)
  return prayerOrder.compactMap { key in
    guard
      let time = snapshot.timings[key],
      let date = dateForPrayerTime(time, on: today)
    else {
      return nil
    }

    return PrayerSequenceItem(
      key: key,
      label: snapshot.labels?[key] ?? defaultPrayerLabel(for: key),
      time: cleanClock(time),
      date: date
    )
  }
}

private func dateForPrayerTime(_ value: String, on day: Date) -> Date? {
  let components = cleanClock(value).split(separator: ":")
  guard
    components.count >= 2,
    let hour = Int(components[0]),
    let minute = Int(components[1])
  else {
    return nil
  }

  var dateComponents = Calendar.current.dateComponents([.year, .month, .day], from: day)
  dateComponents.hour = hour
  dateComponents.minute = minute
  dateComponents.second = 0
  return Calendar.current.date(from: dateComponents)
}

private func cleanClock(_ value: String) -> String {
  String(value.split(separator: " ").first ?? Substring(value))
}

private func startOfDay(_ date: Date) -> Date {
  Calendar.current.startOfDay(for: date)
}

private func defaultPrayerLabel(for key: String) -> String {
  switch key {
  case "Fajr":
    return "Imsak"
  case "Sunrise":
    return "Gunes"
  case "Dhuhr":
    return "Ogle"
  case "Asr":
    return "Ikindi"
  case "Maghrib":
    return "Aksam"
  case "Isha":
    return "Yatsi"
  default:
    return key
  }
}

private extension PrayerWidgetSnapshot {
  static let sample = PrayerWidgetSnapshot(
    timings: [
      "Fajr": "04:12",
      "Sunrise": "05:39",
      "Dhuhr": "13:08",
      "Asr": "17:04",
      "Maghrib": "20:28",
      "Isha": "21:58"
    ],
    locationLabel: "Atasehir",
    utcLabel: "UTC+3",
    sequenceBaseDate: nil,
    labels: [
      "Fajr": "Imsak",
      "Sunrise": "Gunes",
      "Dhuhr": "Ogle",
      "Asr": "Ikindi",
      "Maghrib": "Aksam",
      "Isha": "Yatsi"
    ],
    theme: PrayerWidgetTheme(
      primary: "#1BB89D",
      cardBackground: "#FFFFFF",
      textColor: "#000000",
      mutedTextColor: "#6B7280",
      borderColor: "#006667"
    ),
    savedAt: nil
  )
}

private extension String {
  var nilIfEmpty: String? {
    isEmpty ? nil : self
  }
}

private extension Color {
  init(hex: String?, fallback: Color) {
    guard let hex else {
      self = fallback
      return
    }

    let cleaned = hex
      .trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
      .uppercased()

    guard cleaned.count == 6, let value = UInt64(cleaned, radix: 16) else {
      self = fallback
      return
    }

    let red = Double((value & 0xFF0000) >> 16) / 255
    let green = Double((value & 0x00FF00) >> 8) / 255
    let blue = Double(value & 0x0000FF) / 255
    self = Color(red: red, green: green, blue: blue)
  }
}

private extension View {
  @ViewBuilder
  func widgetBackground<Background: View>(_ background: Background) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      containerBackground(for: .widget) {
        background
      }
    } else {
      self.background(background)
    }
  }
}
