# Sesinden Şarkı — Android + iOS başlangıç prototipi

Bu proje, telefonda ses kaydı alan, kaydı Python tabanlı melodi analiz sunucusuna gönderip nota isimlerini gösteren ve bulunan melodiyi MIDI dosyası olarak dışa aktaran bir **başlangıç prototipidir**. Android ve iOS için Expo / React Native kullanır.

> Önemli: Bu, mağazalara yayımlanmış bitmiş bir uygulama değildir. Nota analizi için yerel bilgisayarda veya sunucuda backend çalıştırılmalıdır. MIDI, tek başına bitmiş bir şarkı/ses kaydı değildir; bir müzik uygulamasında enstrüman ve ritim eklemek için kullanılır.

## 1. Gerekenler
- Node.js LTS
- Expo Go uygulaması (Android veya iOS) ya da Android Studio / Xcode
- Python 3.10–3.12 önerilir

## 2. Mobil uygulamayı başlat
Proje klasöründe:
```bash
npm install
npx expo start
```
Terminaldeki QR kodu Expo Go ile tara. iOS ve Android aynı kod tabanını kullanır.

## 3. Melodi analiz sunucusu
Başka bir terminalde:
```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
# .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```
Bilgisayarın yerel ağ IP adresini öğren (ör. `192.168.1.25`). `App.js` içindeki `API_URL` satırını şu şekilde değiştir:
```js
const API_URL = 'http://192.168.1.25:8000/analyze';
```
`192.168.1.25` yerine kendi IP adresini yaz. Telefon ve bilgisayar aynı Wi-Fi ağında olmalı; güvenlik duvarı 8000 portuna izin vermeli. `localhost` telefonun kendisini gösterdiği için telefondan test ederken kullanma.

## 4. Kullanım
1. Kaydı başlatıp kısa bir melodi söyle veya mırıldan.
2. Kaydı durdur.
3. “Melodiyi analiz et” ile nota tespiti yap.
4. Nota listesini kontrol et.
5. Şarkı adı ve tempoyu girip MIDI dışa aktar.
6. MIDI'yi GarageBand, BandLab veya benzeri bir DAW uygulamasında açıp enstrüman seç.

## Tasarım yönü
- Koyu lacivert stüdyo arayüzü, mor ana aksiyonlar ve turkuaz nota vurguları.
- Üç adımlı akış: **Kaydet → Notalara dönüştür → Müziğe dönüştür**.
- Telefonun yerleşik mikrofonu kullanılır; ilk sürümde bulut hesabı gerekmez, analiz kendi çalıştırdığın sunucuda yapılır.

## İlk sürümün sınırları
- Analiz algoritması tek sesli melodi için tasarlanmıştır; akor, çok sesli şarkı, arka plan müziği veya yoğun efektlerde yanlış nota bulabilir.
- MIDI dışa aktarımı temel bir melodik taslaktır; profesyonel aranje, davul/bas, vokal düzeltme ve doğrudan WAV/MP3 üretimi sonraki aşamadır.
- Bu demo, kullanıcı kaydını harici bir API sağlayıcısına göndermez; yalnızca `API_URL` ile belirlediğin sunucuya yollar. Sunucu güvenliğini ve gizlilik politikasını üretim öncesi ayrıca tasarlamak gerekir.
- Gerçek cihazlarda test, izin metinleri, ağ güvenliği (HTTPS), hata durumları ve mağaza imzalama/yayınlama adımları gerekir.

## Sonraki sürüm için önerilen yol haritası
1. Nota çizgileri üzerinde melodiyi düzenleme ve yanlış notaları düzeltme.
2. Tonalite, ölçü, ritim ve tempo tahmini.
3. Piyano eşliği, davul ve bas altyapısı oluşturma.
4. MIDI yanında WAV/MP3 render ve paylaşım.
5. Hesap, projeleri kaydetme, gizlilik/onay ekranları.
6. iOS TestFlight ve Google Play dahili test yayınları.

## 5. Android APK oluşturma (deneme sürümü)

Bu proje paketi APK üretimine hazırlandı; APK dosyasının kendisi henüz bu arşivin içinde değildir. Expo'nun bulut derlemesi için bir Expo hesabı ve oturum açılması gerekir.

1. Bilgisayarında Node.js LTS kurulu olsun.
2. Proje klasöründe terminal aç:
   ```bash
   npm install
   npx expo install --fix
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform android --profile preview
   ```
3. Derleme tamamlanınca EAS bir APK indirme bağlantısı verir. Bağlantıyı Android telefonunda açıp APK'yı indir ve kur.
4. Android, dış kaynaktan yükleme izni isteyebilir; yalnızca kendi oluşturduğun ve güvendiğin APK için izin ver.

**Not:** İlk prototipte melodi analizi için ayrıca backend sunucusu gerekir. Telefon ve sunucu aynı Wi-Fi ağında olacaksa `App.js` içindeki `API_URL` bilgisayarının yerel IP adresine göre ayarlanmalıdır. Gerçek cihazda test etmeden önce bu ayar yapılmazsa nota analiz özelliği çalışmaz. Kaydetme ekranı tek başına çalışabilir.
