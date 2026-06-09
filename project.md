# 🔧 REFACTORING & ALIGNMENT SPECIFICATION: BACKEND, ML, & FRONTEND
## Target: Sinkronisasi Kode Berjalan dengan Draf Jurnal Ilmiah (Kelompok 13)

Dokumen ini digunakan sebagai instruksi utama bagi AI untuk merombak, menyesuaikan, atau menyempurnakan kode Python (FastAPI) yang SUDAH ADA agar selaras dengan spesifikasi arsitektur IoT Three-Tier dan metodologi Random Forest yang tertulis di draf jurnal kelompok kami.

---

## 1. DETAIL KONEKSI LIVE (SINKRONISASI MQTT BROKER)
Pastikan kode koneksi MQTT klien di backend menggunakan konfigurasi resmi HiveMQ Cloud berikut:
* **Broker Host:** `84d506e218eb46569ba9a4b406fedd66.s1.eu.hivemq.cloud`
* **Port TLS/SSL:** `8883` (Wajib setup `client.tls_set()` pada pustaka `paho-mqtt`)
* **Username:** `Kelompok13IoT`
* **Password:** `Kelompok13IoT`

### Saluran Komunikasi (Topik):
1. **`badge/sensor` (Inbound / Subscribe):** Menerima kiriman array dari ESP32.
2. **`badge/command` (Outbound / Publish):** Mengirimkan instruksi `"ACTIVATE_ALERT"` (jika `sedentary_minutes` $\ge$ 60 data/menit) atau `"DEACTIVATE_ALERT"` (jika pengguna sudah mulai bergerak/aktif kembali).

---

## 2. KONTRAK DATA INPUT (PAYLOAD MPU6050 & LDR)
AI harus memastikan fungsi pembaca atau callback MQTT mampu mengurai (*parsing*) struktur JSON *sliding window* (100 baris x 6 kolom) berikut tanpa terjadi *error* tipe data:

```json
{
  "ldr": 450,
  "data_raw": [
    [0.12, -0.05, 9.81, 0.02, -0.01, 0.03],
    [0.14, -0.04, 9.79, 0.01, 0.00, 0.02]
    // ... total 100 baris matriks runtun waktu (Shape: 100, 6)
  ]
}

3. PENYESUAIAN PIPA PEMROSESAN MACHINE LEARNING (ml_handler.py)Sesuaikan fungsi ekstraksi fitur agar menggunakan NumPy untuk menghitung statistik sliding window sebelum diumpankan ke model .joblib:Ekstraksi Fitur Statistik (12 Fitur):Hitung Mean (Rata-rata) per kolom sumbu dari matriks data_raw (6 fitur).Hitung Standard Deviation (Std Dev) per kolom sumbu dari matriks data_raw (6 fitur).Satukan (concatenate) menjadi satu buah array 1D berukuran (1, 12).Prediksi Model:Transformasikan fitur menggunakan file Scaler.joblib.Klasifikasikan aktivitas menggunakan file HAR_Model_RF.joblib.Penyamaan Label Kelas Jurnal: Hasil prediksi wajib dipetakan ke dalam 5 string konstan ini:0 $\rightarrow$ "SEDENTER"1 $\rightarrow$ "AKTIF"2 $\rightarrow$ "TIDUR_NYENYAK"3 $\rightarrow$ "TIDUR_RINGAN"4 $\rightarrow$ "ALAT_DILEPAS"4. STANDARISASI STRUKTUR DATABASE SQLITE (database.py)Sesuaikan skema basis data SQLite lokal (sensor_data.db) menggunakan SQLAlchemy ORM agar murni mengelola data aktivitas tanpa data pengguna/login:Tabel A: current_status (Hanya 1 baris, ID = 1)Melakukan operasi UPDATE setiap kali ada hasil prediksi aktivitas baru yang masuk.id (INTEGER, Primary Key, Nilai konstan = 1)last_update (TEXT) $\rightarrow$ Waktu data diproses oleh server (YYYY-MM-DD HH:MM:SS).activity_prediction (TEXT) $\rightarrow$ Label string hasil prediksi ML ("SEDENTER", "AKTIF", dll).ldr_value (INTEGER) $\rightarrow$ Nilai sensor intensitas cahaya.sedentary_minutes (INTEGER) $\rightarrow$ Akumulasi menit duduk diam. Bertambah +1 jika kelas = "SEDENTER", langsung kembali ke 0 jika beralih ke kelas lain.Tabel B: activity_history (Operasi INSERT Data Baru)Menyimpan data historis runtun waktu (time-series) jangka panjang untuk konsumsi grafik Frontend.id (INTEGER, Primary Key, Auto Increment)timestamp (TEXT) $\rightarrow$ Waktu pencatatan data (YYYY-MM-DD HH:MM:SS).prediction (TEXT) $\rightarrow$ Label string hasil prediksi ML.ldr_value (INTEGER) $\rightarrow$ Nilai intensitas cahaya.ax_std (REAL / Float) $\rightarrow$ Nilai standar deviasi dari sumbu akselerometer Ax (diperlukan Frontend sebagai pembuktian visual fitur statistik ke dosen penguji).5. SINKRONISASI HTTP REST API UNTUK WEB FRONTEND (REACT.JS)Pastikan berkas main.py membuka akses CORS CORSMiddleware (allow_origins=["*"]) dan mengekspos dua endpoint HTTP GET dengan format respons JSON yang konsisten:Endpoint 1: GET /api/dashboard/currentTujuan: Ditembak oleh komponen React.js via teknik Long Polling per 3 detik sekali.Format Respons JSON:JSON{
  "id": 1,
  "last_update": "2026-06-09 14:15:00",
  "activity_prediction": "SEDENTER",
  "ldr_value": 450,
  "sedentary_minutes": 25
}
Endpoint 2: GET /api/dashboard/historyTujuan: Menyuplai data runtun waktu ke library ApexCharts di Frontend. Batasi output hanya mengambil 100 data terakhir demi performa browser, namun urutkan secara kronologis (dari waktu terlama ke waktu terbaru).Format Respons JSON:JSON[
  {
    "id": 1,
    "timestamp": "2026-06-09 14:14:40",
    "prediction": "SEDENTER",
    "ldr_value": 448,
    "ax_std": 0.02
  },
  {
    "id": 2,
    "timestamp": "2026-06-09 14:15:00",
    "prediction": "SEDENTER",
    "ldr_value": 450,
    "ax_std": 0.01
  }
]