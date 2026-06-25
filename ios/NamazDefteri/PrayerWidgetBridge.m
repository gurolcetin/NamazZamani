#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PrayerWidgetBridge, NSObject)

RCT_EXTERN_METHOD(updateSnapshot:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
