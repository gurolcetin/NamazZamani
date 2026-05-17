# CyberSage — Android Play Store Yayın Rehberi

> **Durum:** Bu döküman 7 Mayıs 2026 tarihinde GitHub Copilot tarafından oluşturulmuştur.  
> Otomatik yapılan değişiklikler `✅ YAPILDI` etiketiyle işaretlenmiştir.  
> Senin yapman gerekenler `⚠️ GEREKLİ` etiketiyle işaretlenmiştir.

---

## İçindekiler

1. [Otomatik Yapılan Değişiklikler](#1-otomatik-yapılan-değişiklikler)
2. [Keystore Güvenliği — ÖNEMLİ](#2-keystore-güvenliği--önemli)
3. [AAB Build Alma](#3-aab-build-alma)
4. [Play Console — Store Listing](#4-play-console--store-listing)
5. [Varlıklar — Ekran Görüntüsü & Grafikler](#5-varlıklar--ekran-görüntüsü--grafikler)
6. [İçerik Derecelendirmesi](#6-içerik-derecelendirmesi)
7. [Veri Güvenliği (Data Safety) Formu](#7-veri-güvenliği-data-safety-formu)
8. [Gizlilik Politikası](#8-gizlilik-politikası)
9. [AAB Yükleme ve Track Seçimi](#9-aab-yükleme-ve-track-seçimi)
10. [Production Release](#10-production-release)
11. [Versiyon Güncelleme Prosedürü](#11-versiyon-güncelleme-prosedürü)
12. [Eksikler Kontrol Listesi](#12-eksikler-kontrol-listesi)
13. [Hata Ayıklama](#13-hata-ayıklama)

---

## 1. Otomatik Yapılan Değişiklikler

Aşağıdaki değişiklikler bu oturumda otomatik olarak uygulanmıştır:

### ✅ Release Keystore Oluşturuldu

```
Dosya:    android/app/cybersage-release.keystore
Alias:    cybersage-key
Algoritma: RSA 2048-bit
Geçerlilik: 10.000 gün (~27 yıl)
```

> **ŞİFRELER** (güvenli bir yere kaydet — kaybolursa uygulama güncellenemiyor):
> - Store Password: `zQ0G0yJPzZJt6GGkeyDn6HgiWJuw`
> - Key Password: `zQ0G0yJPzZJt6GGkeyDn6HgiWJuw`
> - Key Alias: `cybersage-key`

**⚠️ ÖNEMLİ:** Bu şifreyi mutlaka güvenli bir password manager'a (1Password, Bitwarden vb.) kaydet.  
Keystore dosyasını git'e commit etme (`.gitignore`'a eklendi).

---

### ✅ `android/keystore.properties` Oluşturuldu

`android/keystore.properties` dosyası oluşturuldu. Bu dosya git'e commit edilmez (`.gitignore`'a eklendi).  
CI/CD ortamında bu dosyayı secrets'tan inject etmen gerekir.

---

### ✅ `android/app/build.gradle` Güncellendi

| Değişiklik | Önce | Sonra |
|---|---|---|
| Release signing | `debug.keystore` (hatalı!) | `cybersage-release.keystore` |
| ProGuard/R8 | `false` (kapalı) | `true` (açık) |
| shrinkResources | yok | `true` (kullanılmayan kaynakları siler) |
| proguard dosyası | `proguard-android.txt` | `proguard-android-optimize.txt` (daha agresif) |
| manifestPlaceholders | yok (hatalı!) | `debug: cleartext=true`, `release: cleartext=false` |

---

### ✅ `android/app/proguard-rules.pro` Güncellendi

React Native, Hermes, SVG, Vector Icons, Kotlin ve Orientation Locker için keep kuralları eklendi.

---

### ✅ Network Security Config Oluşturuldu

`android/app/src/main/res/xml/network_security_config.xml` oluşturuldu.  
Production build'de cleartext HTTP trafiği (HTTP, sadece HTTPS izinli) engellendi.  
AndroidManifest'e `android:networkSecurityConfig` referansı eklendi.

---

### ✅ `.gitignore` Güncellendi

`keystore.properties` `.gitignore`'a eklendi. Release keystore zaten `*.keystore` kuralıyla kapsanıyor.

---

### ✅ `package.json` Build Script'leri Eklendi

```bash
npm run android:bundle   # AAB üretir (Play Store'a yüklenecek)
npm run android:apk      # APK üretir (test için)
npm run android:clean    # Build cache temizler
```

---

### ✅ Gradle JVM Memory Artırıldı

`android/gradle.properties`:  
`-Xmx2048m` → `-Xmx4096m` (büyük projelerde OOM hatalarını önler)

---

## 2. Keystore Güvenliği — ÖNEMLİ

### Keystore Neden Kritik?

Android'de uygulama imzası **değiştirilemez**. Play Store'a yüklendiğinde aynı keystore ile imzalanmış güncellemeler kabul edilir. Keystore'u kaybedersen uygulamayı bir daha güncelleyemezsin — yeni bir uygulama olarak sıfırdan başlaması gerekir.

### Yedekleme Kontrol Listesi

- [ ] Keystore dosyasını (`cybersage-release.keystore`) harici bir yerde yedekle (USB disk, iCloud, encrypted backup)
- [ ] Şifreyi password manager'a kaydet (`CyberSage2026`)
- [ ] `keystore.properties` dosyasını da yedekle

### Play App Signing (Önerilen)

Play Console, Google'ın keystore'u yönettiği **Play App Signing** özelliğini önerir. Bu özelliği etkinleştirirsen:
- Google, upload keystore'undan başka bir app signing key yönetir
- Keystore'u kaybetsen bile Google kurtarabilir

**Nasıl etkinleştirilir:**
1. Play Console → Uygulamanı seç → Release → Setup → App Signing
2. "Continue" ile Play App Signing'e geç
3. İlk AAB yüklediğinde otomatik etkinleşir

---

## 3. AAB Build Alma

### Ön Koşullar

```bash
# Java 17 kurulu olmalı (zaten kurulu: OpenJDK Corretto 17)
java -version

# Android SDK kurulu olmalı (ANDROID_HOME tanımlı)
echo $ANDROID_HOME

# Node modules kurulu olmalı
npm install
```

### Release AAB Build

```bash
# Proje kökünden:
npm run android:bundle

# veya doğrudan:
cd android && ./gradlew bundleRelease
```

**Çıktı:** `android/app/build/outputs/bundle/release/app-release.aab`

### Build Doğrulama

```bash
# Keystore ile imzayı doğrula
keytool -verify \
  -keystore android/app/cybersage-release.keystore \
  -storepass CyberSage2026 \
  -verbose \
  android/app/build/outputs/bundle/release/app-release.aab
```

### APK Build (Test İçin)

```bash
npm run android:apk
# Çıktı: android/app/build/outputs/apk/release/app-release.apk
```

### APK Cihaza Yükleme (Test)

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 4. Play Console — Store Listing

> Play Console hesabın var, uygulama oluşturma adımını atlıyoruz.

### ⚠️ Store Listing İçin Hazırlanması Gerekenler

#### Uygulama Bilgileri

| Alan | Değer | Durum |
|---|---|---|
| Uygulama Adı | `CyberSage` | Mevcut |
| Package Name | `com.cybersage` | Mevcut |
| Kategori | Eğitim / Education | ⚠️ Belirle |

#### Kısa Açıklama (Short Description) — maks. 80 karakter

```
⚠️ Girilmesi gerekiyor (maksimum 80 karakter)
Örnek: "Yapay zeka destekli siber güvenlik eğitim platformu"
```

#### Tam Açıklama (Full Description) — maks. 4000 karakter

```
⚠️ Girilmesi gerekiyor
- Uygulamanın ne yaptığı
- Öne çıkan özellikler
- Hedef kitle
- Güvenlik/gizlilik vurgusu
```

---

## 5. Varlıklar — Ekran Görüntüsü & Grafikler

### ⚠️ Gerekli Görseller

| Varlık | Boyut | Adet | Durum |
|---|---|---|---|
| App Icon (Hi-res) | 512×512 px PNG (max 1MB) | 1 | ⚠️ Hazırla |
| Feature Graphic | 1024×500 px JPG/PNG | 1 | ⚠️ Hazırla |
| Phone Screenshots | Min 1080px, max 2340px, 16:9 veya 9:16 | Min 2, Max 8 | ⚠️ Çek |
| Tablet Screenshots (7") | Min 1200×1920 | Opsiyonel | - |
| Tablet Screenshots (10") | Min 1200×1920 | Opsiyonel | - |

### App Icon (512×512) Üretimi

Projede `public/assets/images/logo.png` (1024×1024 orijinal logo) mevcut.

```bash
# ImageMagick ile 512x512 üret (önce kur: brew install imagemagick)
convert public/assets/images/logo.png \
  -resize 512x512 \
  docs/assets/play-store-icon-512.png
```

Veya online araç: [https://makeappicon.com](https://makeappicon.com)

### Feature Graphic Üretimi

1024×500 px boyutunda bir görsel. İçerik: uygulama adı + logo + slogan önerilir.  
Araç önerisi: [Canva](https://canva.com) — "Google Play Feature Graphic" şablonu arar.

### Ekran Görüntüsü Çekimi

```bash
# Bağlı cihazdan screenshot al
adb exec-out screencap -p > screenshot_$(date +%s).png

# Release APK yüklenmiş cihazda çek
```

---

## 6. İçerik Derecelendirmesi

### ⚠️ Play Console'da Yapılır

1. Play Console → Uygulama → Policy → App Content → **Content rating**
2. "Start questionnaire" tıkla
3. Kategori: **Education** seç
4. Soruları yanıtla (CyberSage için tipik yanıtlar):
   - Şiddet içeriği: Hayır
   - Cinsel içerik: Hayır
   - Kullanıcı etkileşimi / UGC: Var mı? (chat/forum yoksa Hayır)
   - Gerçek para harcama: Var mı?
5. Rating'i kaydet ve uygula

---

## 7. Veri Güvenliği (Data Safety) Formu

### ⚠️ Play Console'da Yapılır

Play Console → Policy → App Content → **Data Safety**

#### CyberSage için Doldurulacak Bilgiler

Uygulamanın topladığı veriler belirlenmeli. Aşağıdaki tabloya göre yanıtla:

| Veri Türü | Toplanıyor mu? | Paylaşılıyor mu? | Şifrelenmiş mi? |
|---|---|---|---|
| Kullanıcı adı / e-posta | Evet (giriş için) | ⚠️ Backend'e bağlı | Evet (HTTPS) |
| Kullanım verileri (hangi videoları izledi) | Evet | ⚠️ Backend'e bağlı | Evet (HTTPS) |
| Sınav sonuçları | Evet | ⚠️ Backend'e bağlı | Evet (HTTPS) |
| Cihaz bilgisi | Evet (react-native-device-info) | ⚠️ Kontrol et | Evet (HTTPS) |
| Konum | Hayır | - | - |
| Kamera | Hayır | - | - |

**react-native-device-info** ne toplar:
- Cihaz modeli, OS versiyonu, uygulama versiyonu, unique device ID
- Eğer bunları backend'e gönderiyorsan "Device or other IDs" bölümünde belirt

---

## 8. Gizlilik Politikası

### ⚠️ Zorunlu — Onsuz Play Store Kabul Etmez

Play Store her uygulama için geçerli bir gizlilik politikası URL'i zorunlu tutar.

### Seçenekler

**Seçenek A: Hazır Generator**
- [https://app.privacypolicies.com](https://app.privacypolicies.com) (ücretsiz)
- [https://privacypolicytemplate.net](https://privacypolicytemplate.net)

**Seçenek B: Kendi Site/Sayfa**
- Statik bir HTML sayfası (GitHub Pages, Netlify vb.)
- URL: `https://cybersage.example.com/privacy-policy`

### Gizlilik Politikasında Bulunması Gerekenler

1. Hangi kişisel veriler toplanıyor
2. Veriler neden toplanıyor (amaç)
3. Veriler üçüncü taraflarla paylaşılıyor mu
4. Kullanıcıların haklarını nasıl kullanacağı (silme, güncelleme)
5. İletişim bilgileri
6. Son güncelleme tarihi

### Privacy Policy URL'ini Uygulama İçine Ekle

Play Console'a ek olarak uygulama içinde de gösterilmesi önerilir.  
Mevcut `libs/sections/links/` veya profil ekranına eklenebilir.

---

## 9. AAB Yükleme ve Track Seçimi

### Yükleme Adımları

1. **Build al:**
   ```bash
   npm run android:bundle
   ```
   Çıktı: `android/app/build/outputs/bundle/release/app-release.aab`

2. **Play Console'a git:** [https://play.google.com/console](https://play.google.com/console)

3. **Track seç:**
   - **Internal Testing** → Anında yayınlanır, max 100 tester
   - **Closed Testing (Alpha)** → Davetli kullanıcılar
   - **Open Testing (Beta)** → Herkese açık ama "beta" etiketi
   - **Production** → Herkese açık

4. **AAB yükle:** Release → Internal Testing → Create new release → Upload

5. **Release notes ekle** (her dil için):
   ```
   İlk sürüm.
   ```

### Internal Testing'i Tercih Et (İlk Kez)

Production'a geçmeden önce Internal Testing ile test et:
- Uygulama birkaç dakikada kullanılabilir olur
- Gerçek APK/AAB ile test edilir (debug build değil)
- Play App Signing test edilir

---

## 10. Production Release

### ⚠️ Production'a Geçmeden Önce Kontrol Listesi

- [ ] Internal Testing'de en az 1-2 gün test edildi
- [ ] Crash raporları temiz (Play Console → Android Vitals)
- [ ] Store listing tamamlandı (açıklama, görseller)
- [ ] İçerik derecelendirmesi tamamlandı
- [ ] Data Safety formu tamamlandı
- [ ] Gizlilik politikası URL'i girildi
- [ ] Uygulama versiyonu doğru (`versionCode: 1`, `versionName: "1.0"`)

### Production Release Adımları

1. Play Console → Release → Production → Create new release
2. Internal Testing'deki release'i promote et **veya** yeni AAB yükle
3. Yayın notları yaz
4. "Start rollout to Production" tıkla
5. **Rollout percentage:**
   - İlk sürüm için: %20 ile başla, sorun yoksa %100'e çıkar
   - Veya doğrudan %100 (riskli ama basit)

### İnceleme Süresi

İlk sürüm genellikle **1-7 iş günü** içinde incelenir.  
Reddedilirse e-posta gelir, nedenini düzelt ve tekrar gönder.

---

## 11. Versiyon Güncelleme Prosedürü

Her yeni sürüm yüklemeden önce:

### `android/app/build.gradle` güncelle

```groovy
defaultConfig {
    versionCode 2        // Her sürümde +1 (Play Store öncekini kabul etmez)
    versionName "1.1"   // Semantic versioning önerilir
}
```

### Build ve Yükleme

```bash
# 1. Cache temizle
npm run android:clean

# 2. AAB üret
npm run android:bundle

# 3. Play Console'a yükle (yeni release oluştur)
```

### Versiyon Kodu Kuralı

- `versionCode` her sürümde en az 1 artmalı
- Azalamaz, aynı değer kullanılamaz
- Önerilen format: `YYYYMMDDXX` (örn. `2026050701`)

---

## 12. Eksikler Kontrol Listesi

### Teknik Eksikler

| # | Madde | Durum | Not |
|---|---|---|---|
| 1 | Release keystore | ✅ Oluşturuldu | `android/app/cybersage-release.keystore` |
| 2 | Release signing config | ✅ Yapılandırıldı | `build.gradle` güncellendi |
| 3 | ProGuard/R8 | ✅ Etkinleştirildi | `proguard-rules.pro` güncellendi |
| 4 | Network security config | ✅ Oluşturuldu | HTTPS zorunlu, HTTP engellendi |
| 5 | manifestPlaceholders | ✅ Düzeltildi | debug=cleartext allowed, release=denied |
| 6 | Build scripts | ✅ Eklendi | `npm run android:bundle` |
| 7 | Gizlilik politikası URL | ⚠️ GEREKLİ | Play Store zorunlu tutuyor |
| 8 | Data Safety formu | ⚠️ GEREKLİ | Play Console'da doldurulacak |
| 9 | İçerik derecelendirmesi | ⚠️ GEREKLİ | Play Console'da yapılacak |

### Store Varlık Eksikleri

| # | Madde | Boyut | Durum |
|---|---|---|---|
| 1 | App Icon (hi-res) | 512×512 PNG | ⚠️ Logo mevcut, 512px export gerekli |
| 2 | Feature Graphic | 1024×500 | ⚠️ Hazırlanacak |
| 3 | Phone Screenshots | Min 2 | ⚠️ Çekilecek |
| 4 | Kısa açıklama | Max 80 char | ⚠️ Yazılacak |
| 5 | Tam açıklama | Max 4000 char | ⚠️ Yazılacak |
| 6 | Kategori | - | ⚠️ Seçilecek |

### Opsiyonel İyileştirmeler

| # | Madde | Önem | Not |
|---|---|---|---|
| 1 | Play App Signing | Yüksek | Keystore kaybına karşı güvence |
| 2 | Tablet screenshots | Düşük | Sadece telefon gerekli |
| 3 | Promo video | Düşük | YouTube URL eklenebilir |
| 4 | Uygulama içi gizlilik politikası linki | Orta | Profil/Ayarlar ekranına eklenebilir |

---

## 13. Hata Ayıklama

### ProGuard Kaynaklı Crash

ProGuard açıldıktan sonra uygulama crash ederse:

```bash
# APK ile test et (release build, R8 açık)
npm run android:apk
adb install android/app/build/outputs/apk/release/app-release.apk
adb logcat | grep -E "FATAL|AndroidRuntime|ReactNative"
```

Crash'ı `proguard-rules.pro`'ya uygun `-keep` kuralı ekleyerek çöz:

```
# Örnek: mypackage.MyClass korunacaksa
-keep class com.cybersage.MyClass { *; }
```

### AAB Build Hatası

```bash
# Hata detayını görmek için
cd android && ./gradlew bundleRelease --stacktrace 2>&1 | tail -50

# Cache temizle ve tekrar dene
./gradlew clean && ./gradlew bundleRelease
```

### Keystore Doğrulama

```bash
keytool -list \
  -keystore android/app/cybersage-release.keystore \
  -storepass CyberSage2026 \
  -v
```

### Signing Doğrulama (APK)

```bash
# APK imzasını kontrol et
keytool -printcert \
  -jarfile android/app/build/outputs/apk/release/app-release.apk
```

---

## Hızlı Başlangıç Komutu Özeti

```bash
# 1. AAB build al
npm run android:bundle

# 2. Çıktı konumu
# android/app/build/outputs/bundle/release/app-release.aab

# 3. Bu AAB'yi Play Console'a yükle
#    Internal Testing → Create release → Upload
```

---

*Döküman otomatik oluşturuldu — 7 Mayıs 2026*  
*Yapılan değişiklikler: keystore, build.gradle, proguard-rules.pro, network_security_config.xml, .gitignore, package.json, gradle.properties*
