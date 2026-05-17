# NamazDefteri — Android Play Store Yayın Rehberi

> **Durum:** Bu döküman 17 Mayıs 2026 tarihinde GitHub Copilot tarafından oluşturulmuştur.  
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
Dosya:    android/app/namazdefteri-release.keystore
Alias:    namazdefteri-key
Algoritma: RSA 2048-bit
Geçerlilik: 10.000 gün (~27 yıl)
```

> **ŞİFRELER** (güvenli bir yere kaydet — kaybolursa uygulama güncellenemiyor):
> - Store Password: `Nm8zDfTr2026xQkP`
> - Key Password: `Nm8zDfTr2026xQkP`
> - Key Alias: `namazdefteri-key`

**⚠️ ÖNEMLİ:** Bu şifreyi mutlaka güvenli bir password manager'a (1Password, Bitwarden vb.) kaydet.  
Keystore dosyasını git'e commit etme (`.gitignore`'da `*.keystore` kuralı ile kapsanıyor).

---

### ✅ `android/keystore.properties` Oluşturuldu

`android/keystore.properties` dosyası oluşturuldu. Bu dosya git'e commit edilmez (`.gitignore`'a eklendi).  
CI/CD ortamında bu dosyayı secrets'tan inject etmen gerekir.

---

### ✅ `android/app/build.gradle` Güncellendi

| Değişiklik | Önce | Sonra |
|---|---|---|
| Release signing | `debug.keystore` (hatalı!) | `namazdefteri-release.keystore` |
| ProGuard/R8 | `false` (kapalı) | `true` (açık) |
| shrinkResources | yok | `true` (kullanılmayan kaynakları siler) |
| proguard dosyası | `proguard-android.txt` | `proguard-android-optimize.txt` (daha agresif) |
| manifestPlaceholders | yok | `debug: cleartext=true`, `release: cleartext=false` |

---

### ✅ `android/app/proguard-rules.pro` Güncellendi

React Native, Hermes, SVG, Vector Icons, Kotlin, Reanimated, Push Notification ve Google Ads için keep kuralları eklendi.

---

### ✅ Network Security Config Oluşturuldu

`android/app/src/main/res/xml/network_security_config.xml` oluşturuldu.  
Production build'de cleartext HTTP trafiği engellendi (sadece HTTPS). Localhost/Metro Bundler için istisna bırakıldı.  
AndroidManifest.xml'e `android:networkSecurityConfig` referansı eklendi.

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

- [ ] Keystore dosyasını (`namazdefteri-release.keystore`) harici bir yerde yedekle (USB disk, iCloud, encrypted backup)
- [ ] Şifreyi password manager'a kaydet (`Nm8zDfTr2026xQkP`)
- [ ] `keystore.properties` dosyasını da yedekle

### Play App Signing (Önerilen)

Play Console, Google'ın keystore'u yönettiği **Play App Signing** özelliğini önerir:
1. Play Console → Uygulamanı seç → Release → Setup → App Signing
2. "Continue" ile Play App Signing'e geç
3. İlk AAB yüklediğinde otomatik etkinleşir

---

## 3. AAB Build Alma

### Ön Koşullar

```bash
java -version          # Java 17 kurulu olmalı
echo $ANDROID_HOME     # Android SDK tanımlı olmalı
npm install            # Node modules kurulu olmalı
```

### Release AAB Build

```bash
npm run android:bundle
# Çıktı: android/app/build/outputs/bundle/release/app-release.aab
```

### APK Build (Test İçin)

```bash
npm run android:apk
# Çıktı: android/app/build/outputs/apk/release/app-release.apk

# Cihaza yükleme
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Keystore Doğrulama

```bash
keytool -list \
  -keystore android/app/namazdefteri-release.keystore \
  -storepass 'Nm8zDfTr2026xQkP' \
  -v
```

---

## 4. Play Console — Store Listing

### ⚠️ Store Listing İçin Hazırlanması Gerekenler

| Alan | Değer | Durum |
|---|---|---|
| Uygulama Adı | `Namaz Defteri` (veya `Namaz Zamani`) | ⚠️ Belirle |
| Package Name | `com.gmsac.namazdefteri` | Mevcut |
| Kategori | Yaşam Tarzı / Lifestyle veya Din | ⚠️ Seç |
| Kısa Açıklama | Max 80 karakter | ⚠️ Yaz |
| Tam Açıklama | Max 4000 karakter | ⚠️ Yaz |

**Kısa açıklama örneği:**
```
Namaz vakitlerini takip et, kazaları kaydet, kıble bul.
```

---

## 5. Varlıklar — Ekran Görüntüsü & Grafikler

| Varlık | Boyut | Durum |
|---|---|---|
| App Icon (Hi-res) | 512×512 px PNG | ⚠️ Hazırla |
| Feature Graphic | 1024×500 px | ⚠️ Hazırla |
| Phone Screenshots | Min 2 adet | ⚠️ Çek |

```bash
# Bağlı cihazdan screenshot al
adb exec-out screencap -p > screenshot_$(date +%s).png
```

---

## 6. İçerik Derecelendirmesi

### ⚠️ Play Console'da Yapılır

Play Console → Policy → App Content → **Content rating** → Start questionnaire

NamazDefteri için tipik yanıtlar:
- Şiddet içeriği: **Hayır**
- Cinsel içerik: **Hayır**
- Kullanıcı etkileşimi / UGC: **Hayır**
- Gerçek para harcama: Reklam varsa **Evet** (AdMob reklamı mevcut)

---

## 7. Veri Güvenliği (Data Safety) Formu

### ⚠️ Play Console'da Yapılır

Play Console → Policy → App Content → **Data Safety**

| Veri Türü | Toplanıyor mu? | Not |
|---|---|---|
| Konum | Evet (namaz vakti için) | Cihazda işleniyor, backend'e gönderilmiyor |
| Cihaz bilgisi | Evet (react-native-device-info) | OS versiyonu, model |
| Kamera | Hayır | - |
| Kişisel veriler | Hayır | Giriş yok |

**NOT:** Konum verisi sadece namaz vakti hesaplamak için kullanılıyorsa ve sunucuya gönderilmiyorsa "Paylaşılmıyor" olarak işaretle.

---

## 8. Gizlilik Politikası

### ⚠️ Zorunlu — Play Store Onsuz Kabul Etmez

NamazDefteri vurgulanacak noktalar:
- Konum verisi cihazda işlenir, hiçbir sunucuya gönderilmez
- Reklam gösterimi için AdMob kullanılır (Google'ın gizlilik politikasına tabi)
- Kişisel hesap/kayıt sistemi yoktur

**Generator önerisi:** [https://app.privacypolicies.com](https://app.privacypolicies.com)

---

## 9. AAB Yükleme ve Track Seçimi

1. `npm run android:bundle` ile AAB üret
2. [https://play.google.com/console](https://play.google.com/console) adresine git
3. **Internal Testing** ile başla → Create new release → Upload AAB
4. Release notes ekle:
   ```
   İlk sürüm. Namaz vakitleri, kıble yönü ve namaz takip özellikleri.
   ```

---

## 10. Production Release

### ⚠️ Production'a Geçmeden Önce Kontrol Listesi

- [ ] Internal Testing'de test edildi
- [ ] Crash raporları temiz
- [ ] Store listing tamamlandı
- [ ] İçerik derecelendirmesi tamamlandı
- [ ] Data Safety formu tamamlandı
- [ ] Gizlilik politikası URL'i girildi
- [ ] `versionCode: 1`, `versionName: "1.0.0"` doğru

---

## 11. Versiyon Güncelleme Prosedürü

`android/app/build.gradle` güncelle:
```groovy
defaultConfig {
    versionCode 2        // Her sürümde +1
    versionName "1.1.0"
}
```

```bash
npm run android:clean
npm run android:bundle
# Play Console'a yükle → yeni release oluştur
```

---

## 12. Eksikler Kontrol Listesi

### Teknik (Otomatik Yapıldı)

| # | Madde | Durum |
|---|---|---|
| 1 | Release keystore | ✅ `android/app/namazdefteri-release.keystore` |
| 2 | Release signing config | ✅ `build.gradle` güncellendi |
| 3 | ProGuard/R8 | ✅ Etkinleştirildi |
| 4 | Network security config | ✅ Oluşturuldu |
| 5 | manifestPlaceholders | ✅ debug/release için ayarlandı |
| 6 | Build scripts | ✅ `npm run android:bundle` |
| 7 | JVM memory | ✅ 4096m'ye artırıldı |
| 8 | .gitignore | ✅ keystore.properties eklendi |

### Store (Senin Yapman Gerekiyor)

| # | Madde | Durum |
|---|---|---|
| 1 | Gizlilik politikası URL | ⚠️ GEREKLİ |
| 2 | Data Safety formu | ⚠️ Play Console'da |
| 3 | İçerik derecelendirmesi | ⚠️ Play Console'da |
| 4 | App Icon 512×512 | ⚠️ Hazırla |
| 5 | Feature Graphic 1024×500 | ⚠️ Hazırla |
| 6 | Ekran görüntüleri (min 2) | ⚠️ Çek |
| 7 | Kısa açıklama | ⚠️ Yaz |
| 8 | Tam açıklama | ⚠️ Yaz |

---

## 13. Hata Ayıklama

### ProGuard Kaynaklı Crash

```bash
npm run android:apk
adb install android/app/build/outputs/apk/release/app-release.apk
adb logcat | grep -E "FATAL|AndroidRuntime|ReactNative"
```

Crash'ı `proguard-rules.pro`'ya `-keep` kuralı ekleyerek çöz.

### AAB Build Hatası

```bash
cd android && ./gradlew bundleRelease --stacktrace 2>&1 | tail -50
./gradlew clean && ./gradlew bundleRelease
```

### Signing Doğrulama

```bash
keytool -printcert \
  -jarfile android/app/build/outputs/apk/release/app-release.apk
```

---

## Hızlı Başlangıç

```bash
# 1. AAB build al
npm run android:bundle

# 2. Çıktı
# android/app/build/outputs/bundle/release/app-release.aab

# 3. Play Console → Internal Testing → Create release → Upload
```

---

*Döküman otomatik oluşturuldu — 17 Mayıs 2026*  
*Yapılan değişiklikler: namazdefteri-release.keystore, keystore.properties, build.gradle, proguard-rules.pro, network_security_config.xml, AndroidManifest.xml, .gitignore, package.json, gradle.properties*
