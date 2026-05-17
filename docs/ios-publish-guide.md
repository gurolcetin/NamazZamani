# CyberSage — iOS App Store Yayın Rehberi

> **Durum:** Bu döküman 7 Mayıs 2026 tarihinde GitHub Copilot tarafından oluşturulmuştur.  
> Otomatik yapılan değişiklikler `✅ YAPILDI` etiketiyle işaretlenmiştir.  
> Senin yapman gerekenler `⚠️ GEREKLİ` etiketiyle işaretlenmiştir.

---

## İçindekiler

1. [Otomatik Yapılan Değişiklikler](#1-otomatik-yapılan-değişiklikler)
2. [Mevcut Durum — İyi Haberler](#2-mevcut-durum--iyi-haberler)
3. [Ön Koşullar](#3-ön-koşullar)
4. [Archive ve IPA Üretme](#4-archive-ve-ipa-üretme)
5. [App Store Connect — Uygulama Oluşturma](#5-app-store-connect--uygulama-oluşturma)
6. [Store Listing — Varlıklar](#6-store-listing--varlıklar)
7. [App Privacy — Gizlilik Formu](#7-app-privacy--gizlilik-formu)
8. [TestFlight ile Test](#8-testflight-ile-test)
9. [App Review Gönderme](#9-app-review-gönderme)
10. [Versiyon Güncelleme Prosedürü](#11-versiyon-güncelleme-prosedürü)
11. [Eksikler Kontrol Listesi](#12-eksikler-kontrol-listesi)
12. [Hata Ayıklama](#13-hata-ayıklama)

---

## 1. Otomatik Yapılan Değişiklikler

### ✅ `ios/CyberSage/Info.plist` — Boş `NSLocationWhenInUseUsageDescription` Kaldırıldı

Projede konum izni kullanılmıyor ancak Info.plist'te boş string ile tanımlanmıştı.  
Apple, kullanılmayan izin açıklamalarını reddet gerekçesi yapabilir — kaldırıldı.

---

### ✅ `ios/CyberSage.xcodeproj/project.pbxproj` — Release Signing Identity Düzeltildi

| | Önce | Sonra |
|---|---|---|
| Release `CODE_SIGN_IDENTITY` | `"Apple Development"` ❌ | `"Apple Distribution"` ✅ |
| Debug `CODE_SIGN_IDENTITY` | `"Apple Development"` | değişmedi |

`Apple Distribution` sertifikası keychain'de mevcut:  
`Apple Distribution: Gurol Mehmet Çetin (4JUR4D44S2)`

---

### ✅ `ios/ExportOptions.plist` Oluşturuldu

CLI ile archive export için gerekli yapılandırma dosyası:
- Method: `app-store-connect`
- Team: `4JUR4D44S2`
- Signing style: `automatic`
- Upload symbols: `true` (crash raporları için)

---

### ✅ `package.json` — iOS Build Script'leri Eklendi

```bash
npm run ios:archive   # xcarchive üretir
npm run ios:export    # IPA üretir ve App Store Connect'e upload eder
npm run ios:clean     # build temizler
```

---

## 2. Mevcut Durum — İyi Haberler

Projenin iOS yayın altyapısı büyük ölçüde hazır:

| Durum | Detay |
|---|---|
| ✅ App icon tam | 1024×1024 `ItunesArtwork@2x.png` + tüm boyutlar mevcut |
| ✅ Release scheme var | `CyberSage-Release.xcscheme` mevcut, Release config'e bağlı |
| ✅ Bundle ID ayrıldı | Debug: `...cybersage.dev`, Release: `com.gmsac.cybersage` |
| ✅ Apple Distribution sertifikası var | Keychain'de `Apple Distribution: Gurol Mehmet Çetin (4JUR4D44S2)` |
| ✅ Team ID tanımlı | `4JUR4D44S2` |
| ✅ Privacy manifest var | `PrivacyInfo.xcprivacy` dolu |
| ✅ New Architecture aktif | `RCTNewArchEnabled = true` |
| ✅ Minimum deployment target | iOS 15.1 |
| ✅ NSAppTransportSecurity | `NSAllowsArbitraryLoads = false` (production-safe) |
| ✅ Kategori tanımlı | `public.app-category.education` |

---

## 3. Ön Koşullar

### Xcode Durumu

```
Xcode 26.3 (Build 17C529) — yüklü ✅
```

### Apple Developer Hesabı Kontrol

1. [developer.apple.com](https://developer.apple.com) → Account
2. **Paid membership** aktif olmalı ($99/yıl) — ücretsiz hesapla App Store'a yükleyemezsin
3. Team ID: `4JUR4D44S2` (zaten projede tanımlı)

### Provisioning Profile

Automatic signing kullanıyorsun, Xcode bunu otomatik yönetir.  
Yine de Xcode'da bir kez kontrol et:

1. `ios/CyberSage.xcworkspace` aç
2. CyberSage target → Signing & Capabilities sekmesi
3. Release → "Automatically manage signing" ✅ işaretli olmalı
4. Team: `Gurol Mehmet Çetin (4JUR4D44S2)` seçili olmalı

### Pods Güncel Mi?

```bash
cd ios && pod install && cd ..
```

---

## 4. Archive ve IPA Üretme

### Yöntem A: Xcode GUI (Önerilen İlk Seferlik)

1. Xcode'da `CyberSage.xcworkspace` aç
2. Sol üstte scheme seç: **CyberSage-Release**
3. Cihaz hedefi: **Any iOS Device (arm64)** seç (simülatör değil!)
4. Menü: **Product → Archive**
5. Bitince Xcode Organizer açılır (Window → Organizer)
6. Archive seç → **Distribute App**
7. **App Store Connect** seç → Next
8. **Upload** seç → Next
9. Seçenekleri varsayılan bırak → Next → Distribute

---

### Yöntem B: CLI (Otomasyon / CI için)

```bash
# 1. Archive üret
npm run ios:archive
# veya:
xcodebuild \
  -workspace ios/CyberSage.xcworkspace \
  -scheme CyberSage-Release \
  -configuration Release \
  -archivePath ios/build/CyberSage.xcarchive \
  archive

# 2. App Store Connect'e yükle
npm run ios:export
# veya:
xcodebuild \
  -exportArchive \
  -archivePath ios/build/CyberSage.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ios/build/export
```

**Çıktı:** `ios/build/export/CyberSage.ipa`

---

### Yöntem C: Altool / xcrun altool (Eski Yöntem)

```bash
# IPA'yı manuel yükle
xcrun altool \
  --upload-app \
  --type ios \
  --file ios/build/export/CyberSage.ipa \
  --username "gurolmehmetcetin@icloud.com" \
  --password "@keychain:AC_PASSWORD"
```

---

## 5. App Store Connect — Uygulama Oluşturma

> App Store Connect hesabın var, bu adımı kısaltıyoruz.

### ⚠️ Yeni Uygulama Oluştur (Eğer Yoksa)

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → **+**
2. Platform: **iOS**
3. Name: `CyberSage`
4. Primary Language: Turkish veya English
5. Bundle ID: `com.gmsac.cybersage` (dropdown'da görünmeli — görünmüyorsa önce Xcode ile archive al)
6. SKU: `cybersage-001` (benzersiz, dışarıdan görünmez)

---

## 6. Store Listing — Varlıklar

### ⚠️ Gerekli Görseller

| Varlık | Boyut | Zorunlu | Durum |
|---|---|---|---|
| App Icon | 1024×1024 PNG (no alpha) | Evet | ✅ Mevcut (`ItunesArtwork@2x.png`) |
| iPhone 6.9" Screenshots | 1320×2868 veya 2868×1320 | Evet | ⚠️ Çekilecek |
| iPhone 6.5" Screenshots | 1242×2688 | Evet (eski fallback) | ⚠️ Çekilecek |
| iPad 13" Screenshots | 2064×2752 | iPad desteği varsa | Opsiyonel |

> **Önemli:** 2025 itibarıyla App Store Connect **iPhone 6.9" (iPhone 16 Pro Max)** ekran görüntüsü zorunlu tutuyor.  
> En az **3 ekran görüntüsü** gerekli, maksimum 10.

#### ⚠️ App Icon'da Alpha Kanalı Sorunu

Mevcut `ItunesArtwork@2x.png` RGBA formatında (alpha kanalı var). App Store Connect **alpha kanallı icon'u reddeder**.  
Icon'ı düz RGB'ye dönüştür:

```bash
# ImageMagick ile alpha kaldır (brew install imagemagick)
convert ios/CyberSage/Images.xcassets/AppIcon.appiconset/ItunesArtwork@2x.png \
  -background white \
  -alpha remove \
  -alpha off \
  ios/CyberSage/Images.xcassets/AppIcon.appiconset/ItunesArtwork@2x.png
```

**veya** online: [https://www.remove-alpha.com](https://www.remove-alpha.com)

---

### ⚠️ Ekran Görüntüsü Çekimi

**Simulator ile (Xcode):**
```bash
# iPhone 16 Pro Max simülatörü başlat
react-native run-ios --simulator="iPhone 16 Pro Max"

# Screenshot al (Simulator menü: File → Take Screenshot)
# veya:
xcrun simctl io booted screenshot screenshot_$(date +%s).png
```

**Gerçek cihazla (önerilen):**  
Release APK veya Debug build'i cihaza yükle, ekran görüntüsü al.

---

### ⚠️ Kısa Açıklama (Subtitle) — maks. 30 karakter

App Store'da uygulama adının altında görünür.  
Örnek: `Siber Güvenlik Eğitimi`

### ⚠️ Tam Açıklama — maks. 4000 karakter

- İlk 3 satır kritik (kullanıcı "daha fazla" basmadan görür)
- Anahtar özellikler
- Hedef kitle
- Güncelleme notları

### ⚠️ Keywords — maks. 100 karakter, virgülle ayrılmış

Örnek: `siber güvenlik,eğitim,sınav,kurs,öğrenme`

---

## 7. App Privacy — Gizlilik Formu

### ⚠️ App Store Connect'te Doldurulur

App Store Connect → Uygulamanı seç → App Privacy → Get Started

#### CyberSage için Tipik Yanıtlar

**Veri Toplama:**

| Veri Türü | Toplanıyor | Tracking | Amaç |
|---|---|---|---|
| Email Adresi | Evet | Hayır | App functionality, authentication |
| Kullanıcı ID | Evet | Hayır | App functionality |
| Kullanım Verileri | Evet | Hayır | App functionality, analytics |
| Cihaz ID (`react-native-device-info`) | Evet | Hayır | App functionality |
| Konum | Hayır | — | — |
| Kamera | Hayır | — | — |

**NSPrivacyTracking = false** (PrivacyInfo.xcprivacy'de zaten ayarlı ✅)

---

### ⚠️ Gizlilik Politikası URL

App Store Connect'te zorunlu. Android için de aynı URL kullanılabilir.

---

## 8. TestFlight ile Test

### Internal Testing (Önerilen İlk Adım)

1. App Store Connect → TestFlight → Internal Testing
2. Build yüklendikten sonra (genellikle 15-30 dk işleme) aktif olur
3. Apple Developer hesabındaki kullanıcılara anında dağıtım
4. **Review gerekmez**

### External Testing

1. TestFlight → External Testing → Create Group
2. E-posta ile davet (Apple hesabı şart değil)
3. **Beta App Review** gerekir (genellikle 1-3 gün)
4. Maximum 10.000 tester

### TestFlight'ta Test Edilecekler

- [ ] Tüm ekranlar dolaşılsın
- [ ] Video oynatma çalışıyor mu
- [ ] Sınav akışı doğru mu
- [ ] Giriş/çıkış akışı
- [ ] Push notification var mı (varsa test et)
- [ ] Offline durumu
- [ ] Dil değişimi (TR/EN)

---

## 9. App Review Gönderme

### ⚠️ Gönderim Öncesi Kontrol Listesi

- [ ] TestFlight'ta en az birkaç gün test edildi
- [ ] Crash yok (App Store Connect → Crashes bölümü temiz)
- [ ] Store listing eksiksiz (açıklama, ekran görüntüleri, icon)
- [ ] App Privacy dolduruldu
- [ ] Gizlilik politikası URL girildi
- [ ] Age rating tamamlandı (App Information → Age Rating)
- [ ] Content Rights: Sahip olduğun içerik mi? → Yes
- [ ] Pricing: Free mi, paid mi?

### Production Release Gönderimi

1. App Store Connect → Uygulamanı seç → + Version
2. Version: `1.0.0`
3. "What's New in This Version" yaz (her dil için)
4. Build seç (TestFlight'ta test ettiğin build)
5. **Submit for Review**

### App Review Notes (İnceleyiciye Not)

Review ekibine şunları belirt:
```
Demo Account (eğer giriş gerektiriyorsa):
Username: demo@test.com
Password: Demo1234!

Bu uygulama siber güvenlik eğitim platformudur.
Video içerikleri ve sınav modülü içermektedir.
```

### İnceleme Süresi

- İlk sürüm: genellikle **1-7 gün**
- Sonraki sürümler: genellikle **1-2 gün**
- Reddedilirse e-posta gelir, Resolution Center'da yanıt ver

---

## 10. Versiyon Güncelleme Prosedürü

### `project.pbxproj`'de Versiyon Güncelle

Xcode'da her iki değeri güncelle (veya terminal ile):

```bash
# Mevcut değerler:
# MARKETING_VERSION = 1.0.0   → kullanıcıya gösterilen (1.1.0, 2.0.0 vb.)
# CURRENT_PROJECT_VERSION = 1  → build numarası, her gönderimde +1

# Xcode → CyberSage target → General → Version & Build
```

Veya `project.pbxproj`'de elle:
```
MARKETING_VERSION = 1.1.0;
CURRENT_PROJECT_VERSION = 2;
```

**Kural:** App Store'a aynı Build numarasıyla iki kez yükleyemezsin.  
Her archive'dan önce `CURRENT_PROJECT_VERSION` +1 artır.

---

## 11. Eksikler Kontrol Listesi

### Teknik Eksikler

| # | Madde | Durum | Not |
|---|---|---|---|
| 1 | Release CODE_SIGN_IDENTITY | ✅ Düzeltildi | "Apple Distribution" |
| 2 | Boş location izni kaldırıldı | ✅ Düzeltildi | NSLocationWhenInUseUsageDescription silindi |
| 3 | ExportOptions.plist | ✅ Oluşturuldu | CLI export için |
| 4 | iOS build scriptleri | ✅ Eklendi | package.json |
| 5 | App icon alpha kanalı | ⚠️ GEREKLİ | 1024x1024 icon RGB'ye dönüştürülmeli |
| 6 | Provisioning profile (Xcode'da kontrol) | ⚠️ Kontrol et | Automatic signing ayarı |

### Store Varlık Eksikleri

| # | Madde | Durum |
|---|---|---|
| 1 | iPhone 6.9" Screenshots | ⚠️ Çekilecek |
| 2 | iPhone 6.5" Screenshots | ⚠️ Çekilecek |
| 3 | Subtitle (30 karakter) | ⚠️ Yazılacak |
| 4 | Full Description | ⚠️ Yazılacak |
| 5 | Keywords | ⚠️ Yazılacak |
| 6 | Gizlilik Politikası URL | ⚠️ Oluşturulacak |
| 7 | Age Rating | ⚠️ App Store Connect'te doldurulacak |
| 8 | App Privacy formu | ⚠️ App Store Connect'te doldurulacak |

---

## 12. Hata Ayıklama

### Archive Başarısız — Code Signing Hatası

```
error: No signing certificate "Apple Distribution" found
```

**Çözüm:**
1. Xcode → Preferences → Accounts → Apple ID seçili mi?
2. "Download Manual Profiles" tıkla
3. Keychain'de `Apple Distribution: Gurol Mehmet Çetin (4JUR4D44S2)` görünüyor mu:
   ```bash
   security find-identity -v -p codesigning
   ```

---

### "Missing Compliance" Hatası (TestFlight)

Uygulamanın şifreleme kullanıp kullanmadığı sorulur.  
HTTPS/TLS standart kullanımı için:

`Info.plist`'e ekle:
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Bu eklenmezse her build yüklemesinde App Store Connect senden compliance yanıtı ister.

---

### "ITMS-90683: Missing Purpose String" Hatası

Kullanılan bir framework izin description'ı gerektiriyor demektir.  
`react-native-device-info` bazı sürümlerde bu hatayı verir. Çözüm:

```xml
<!-- Info.plist'e ekle, gerekirse -->
<key>NSUserTrackingUsageDescription</key>
<string>Bu uygulama reklam gösterimi yapmaz.</string>
```

---

### Build Numarası Çakışması

```
ERROR ITMS-90189: Redundant Binary Upload
```

`CURRENT_PROJECT_VERSION` zaten yüklenmiş bir değer. Artır:

```bash
# Xcode → CyberSage target → General → Build numarasını artır
# veya project.pbxproj'de:
# CURRENT_PROJECT_VERSION = 2;  (mevcut: 1)
```

---

### Pod Hatası

```bash
cd ios
pod deintegrate
pod install
cd ..
```

---

## Hızlı Başlangıç — Özet

```bash
# 1. Pods güncelle
cd ios && pod install && cd ..

# 2. Xcode'da aç
open ios/CyberSage.xcworkspace

# 3. Scheme: CyberSage-Release, Hedef: Any iOS Device (arm64)

# 4. Product → Archive

# 5. Organizer → Distribute App → App Store Connect → Upload
```

---

*Döküman otomatik oluşturuldu — 7 Mayıs 2026*  
*Yapılan değişiklikler: Info.plist (NSLocation kaldırıldı), project.pbxproj (Release signing düzeltildi), ExportOptions.plist (oluşturuldu), package.json (iOS scriptler eklendi)*
