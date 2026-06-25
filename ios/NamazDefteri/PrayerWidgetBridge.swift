import Foundation
import React
import WidgetKit

private enum PrayerWidgetStorage {
  static let appGroupIdentifier = "group.com.gmsac.namazdefteri"
  static let snapshotKey = "prayer_widget_snapshot"
  static let widgetKind = "PrayerTimeCountdownWidget"
}

@objc(PrayerWidgetBridge)
final class PrayerWidgetBridge: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(updateSnapshot:resolver:rejecter:)
  func updateSnapshot(
    _ payload: NSDictionary,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: PrayerWidgetStorage.appGroupIdentifier) else {
      reject("APP_GROUP_UNAVAILABLE", "Prayer widget App Group is not available.", nil)
      return
    }

    let payloadObject = payload as? [String: Any] ?? [:]
    guard JSONSerialization.isValidJSONObject(payloadObject) else {
      reject("INVALID_WIDGET_PAYLOAD", "Prayer widget payload is not valid JSON.", nil)
      return
    }

    do {
      let data = try JSONSerialization.data(withJSONObject: payloadObject, options: [])
      let json = String(data: data, encoding: .utf8)
      defaults.set(json, forKey: PrayerWidgetStorage.snapshotKey)
      defaults.synchronize()
      WidgetCenter.shared.reloadTimelines(ofKind: PrayerWidgetStorage.widgetKind)
      resolve(true)
    } catch {
      reject("WIDGET_PAYLOAD_SERIALIZATION_FAILED", "Prayer widget payload could not be saved.", error)
    }
  }
}
