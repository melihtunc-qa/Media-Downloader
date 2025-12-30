# 🎬 Multimedia Downloader (Electron)

Bu proje, Electron ve yt-dlp kullanılarak geliştirilmiş, YouTube ve diğer birçok platformdan yüksek kalitede video veya ses (MP3) indirmeyi sağlayan modern bir masaüstü uygulamasıdır.

### 🌟 Özellikler (v1.5)

**Format Seçeneği**: Orijinal kalitede video veya sadece ses (MP3) indirme.

**Ardışık İndirme** : Oynatma listelerini tek URL ile sıralı şekilde indirebilme.

**Çift Dil Desteği (TR/EN)**: Arayüz ve işlem logları, seçilen dile göre otomatik değişir.

**Akıllı Birleştirme**: ffmpeg entegrasyonu sayesinde ses ve görüntüyü kayıpsız birleştirir.

**Güvenli İptal**: İndirme işlemi iptal edildiğinde arka planda çalışan tüm süreçleri (process tree) temizler.

**Kullanıcı Dostu**: Karmaşık terminal kodları yerine anlaşılır durum mesajları gösterir ve basit bir arayüze sahiptir.

**Çapraz Platform**: Windows, macOS ve Linux için paketlenebilir. (Developer Mode)


### 🛠️ Kurulum ve Geliştirme


### 📥 Windows İşletim sistemleri için masaüstü kurulumunu  [buradan](https://drive.google.com/file/d/1Q-rwx6ayPffx3aiMzTJUa4nbA3WyW8-P/view?usp=sharing) indirebilirsiniz (.exe)


Projeyi bilgisayarınızda çalıştırmak için şu adımları izleyin:

#### Bağımlılıkları Yükleyin:

```bash
npm install
```

📌Binary Dosyalarını Hazırlayın (ÖNEMLİ):
Projenin tüm işletim sistemlerinde çalışması için yt-dlp ve ffmpeg dosyalarının bin klasöründe olması gerekir.Mevcut versiyon sadece Windows için kullanılabilir durumdadır.

İşletim sisteminize göre şu yapıyı oluşturun:

```bash
bin/
├── win/
│   ├── yt-dlp.exe
│   ├── ffmpeg.exe
│   └── icon.png
├── mac/
│   ├── yt-dlp
│   ├── ffmpeg
│   └── icon.icns
└── linux/
    ├── yt-dlp
    ├── ffmpeg
    └── icon.png
```


(Not: ffmpeg için "Essentials" sürümü yeterlidir.)

Uygulamayı Başlatın:

```bash
npm start
```

### 📦 Paketleme (.exe / .dmg / .AppImage)

Uygulamayı dağıtılabilir kurulum dosyasına çevirmek için electron-builder kullanılmıştır.

Windows için:
```bash
npm run build:win
```

Mac için:

```bash
npm run build:mac
```

Linux için:
```bash
npm run build:linux
```

Çıktı dosyaları dist klasöründe oluşacaktır.


### 🏗️ Kullanılan Teknolojiler

**Electron**: Masaüstü arayüzü.

**Node.js**: Arka plan işlemleri.

**yt-dlp**: Medya indirme motoru.

**FFmpeg**: Ses ve görüntü işleme/birleştirme.

**tree-kill**: İşlem yönetimi ve güvenli kapatma.

### 📄 Lisans

Bu proje ISC lisansı ile lisanslanmıştır.
