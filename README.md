# 🏷️ Smart Wearable Badge — IoT Wellness Monitor

> Dashboard web real-time untuk memantau aktivitas fisik, deteksi sedentary, dan kualitas tidur menggunakan ESP32 + MPU6050 + Machine Learning.

---

## 🗂️ Struktur Proyek

```
react-dashboard/
├── src/                        ← Frontend React (Vite + Tailwind)
│   ├── components/
│   │   ├── layout/             ← Sidebar, TopBar, BottomNav
│   │   └── pages/              ← Dashboard, HealthMetrics, Devices
│   ├── App.jsx
│   └── main.jsx
│
├── backend/                    ← Backend Python (Flask + MQTT + SQLite)
│   ├── app.py                  ← API server utama
│   ├── database.py             ← Model SQLite (SQLAlchemy)
│   ├── mqtt_simulator.py       ← Simulator ESP32 (tanpa hardware)
│   └── models/                 ← File model ML terlatih (.pkl)
│
├── machine-learning/           ← ML Pipeline (training)
│   ├── ml_wellness_pipeline.py ← Script training semua model
│   └── Dataset/                ← Dataset CSV MPU6050
│
├── firmware/                   ← Kode Arduino untuk ESP32
│   └── smart_wearable_badge/
│       └── smart_wearable_badge.ino
│
├── requirements.txt            ← Python dependencies
├── package.json                ← Node.js dependencies
└── sensor_data.db              ← Database SQLite (auto-generated)
```

---

## 🚀 Cara Menjalankan

### Mode 1: Demo Software (Tanpa Hardware)

> Gunakan MQTT Simulator sebagai pengganti ESP32.

**Terminal 1 — Backend:**
```bash
# Dari root folder proyek
pip install -r requirements.txt
python backend/app.py
```

**Terminal 2 — MQTT Simulator (ganti ESP32):**
```bash
python backend/mqtt_simulator.py
```

**Terminal 3 — Frontend:**
```bash
npm install
npm run dev
```

Buka browser: `http://localhost:5173`

---

### Mode 2: Dengan Hardware ESP32

1. Install **Arduino IDE 2.x**
2. Tambahkan board ESP32 di Board Manager:
   ```
   URL: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Install library via Library Manager:
   - `PubSubClient` by Nick O'Leary
   - `MPU6050` by Electronic Cats
   - `ArduinoJson` by Benoit Blanchon
   - `I2Cdevlib-MPU6050` (dependency)
4. Buka `firmware/smart_wearable_badge/smart_wearable_badge.ino`
5. **Ganti** `WIFI_SSID` dan `WIFI_PASSWORD` sesuai jaringan Anda
6. Upload ke ESP32
7. Jalankan Backend + Frontend (tanpa simulator)

---

## 🔌 Wiring Hardware

| ESP32 GPIO | Komponen | Keterangan |
|---|---|---|
| GPIO 21 (SDA) | MPU6050 SDA | I2C Data |
| GPIO 22 (SCL) | MPU6050 SCL | I2C Clock |
| 3.3V | MPU6050 VCC | Power sensor |
| GND | MPU6050 GND | Ground |
| GPIO 34 (ADC) | LDR + R 10kΩ | Sensor cahaya |
| GPIO 26 | Buzzer (+) | Alarm sedentary |
| GND | Buzzer (-) | Ground |
| VIN / 5V | TP4056 OUT+ | Power dari baterai |

---

## 📡 MQTT Topics

| Topic | Arah | Isi |
|---|---|---|
| `iot/pulsebadge/sensors` | ESP32 → Backend | JSON sensor data |
| `iot/pulsebadge/commands` | Backend → ESP32 | JSON command (buzzer, dll) |

**Contoh payload sensor:**
```json
{
  "Ax": 0.12, "Ay": -0.05, "Az": 9.81,
  "Gx": 1.20, "Gy": -0.80, "Gz": 0.30,
  "Lux": 245,
  "battery": 82
}
```

---

## 🧠 Machine Learning Models

| Model | Algoritma | Fungsi |
|---|---|---|
| `model_activity.pkl` | Random Forest (150 trees) | Klasifikasi aktivitas: Sitting, Walking, Standing, Running, dll |
| `model_sedentary.pkl` | Random Forest (100 trees) | Deteksi sedentary vs aktif |
| `model_sleep.pkl` | Random Forest (100 trees) | Klasifikasi sleep stage: Awake, Light, Deep, REM |

**Melatih ulang model:**
```bash
python machine-learning/ml_wellness_pipeline.py
```

---

## 🌐 REST API Endpoints

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/status` | Status real-time device |
| GET | `/api/history` | Riwayat aktivitas (30 terakhir) |
| GET | `/api/sleep-analysis` | Analisis kualitas tidur |
| POST | `/api/dismiss` | Matikan buzzer alert |
| POST | `/api/sync` | Force sync ke device |
| POST | `/api/settings/buzzer` | Toggle buzzer on/off |
| POST | `/api/settings/optimization` | Toggle mode optimasi baterai |

---

## ⚙️ Fitur Utama

- 📊 **Dashboard Real-time** — Monitor aktivitas, LDR, baterai, status MQTT
- ⏰ **Sedentary Alert** — Buzzer aktif otomatis setelah ≥50 menit duduk
- 😴 **Sleep Monitoring** — Deteksi 4 stage tidur (Awake, Light, Deep, REM)
- 📈 **Health Metrics** — Grafik riwayat aktivitas dan analisis tidur
- 📱 **Responsive** — Tampilan optimal di desktop dan mobile
- 🔋 **Battery Tracking** — Monitor level baterai device
