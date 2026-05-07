# 🏥 Sistem Antrian LAN — Desktop App

Aplikasi desktop antrian klinik. Server, console, dan display semuanya dalam
satu aplikasi. Bisa diakses dari banyak PC lewat jaringan LAN/WiFi.

---

## ⚡ Buat File Installer (.exe) — Windows

### Syarat
- Install **Node.js LTS** dari https://nodejs.org

### Langkah
1. Ekstrak ZIP ini
2. **Klik 2x → `BUILD-WINDOWS.bat`**
3. Tunggu proses selesai (~3–10 menit, butuh internet sekali)
4. File `Antrian LAN Setup x.x.x.exe` akan muncul di folder `dist\`
5. Bagikan file `.exe` itu ke PC mana saja — tinggal klik install!

---

## 🐧 Linux / macOS

```bash
bash build-linux-mac.sh
```

---

## ▶️ Jalankan Tanpa Build (Mode Dev)

```
npm install
npm start
```

---

## 🖥️ Fitur Aplikasi

- **Dashboard** — tampilkan IP server otomatis, live stats antrian
- **Console Operator** — buka sebagai jendela baru atau di browser
- **Display Antrian** — layar besar + suara otomatis (Bahasa Indonesia)
- **Tray icon** — app tetap hidup di background, tidak ganggu taskbar
- **Auto-reconnect** — semua client reconnect otomatis jika server restart

---

## 📡 Cara Pakai di Klinik

```
PC SERVER          →  double-klik shortcut "Antrian LAN"
PC OPERATOR        →  buka browser → http://[IP-SERVER]:3000/console
LAYAR TV/MONITOR   →  buka browser → http://[IP-SERVER]:3000/display
```

IP server ditampilkan di dashboard utama aplikasi.

