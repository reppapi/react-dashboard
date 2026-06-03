/*
 * ============================================================
 *  Smart Wearable Badge - Firmware ESP32
 *  Proyek IoT Wellness Monitor
 * ============================================================
 *  Hardware:
 *    - ESP32 (Wemos D1 Mini / DevKit)
 *    - MPU6050 (Accelerometer + Gyroscope) via I2C
 *    - LDR / Photo Resistor (Sensor Cahaya) via ADC
 *    - Buzzer Aktif
 *    - Baterai Li-Po 3.7V + TP4056
 *
 *  Library yang dibutuhkan (install via Arduino Library Manager):
 *    1. PubSubClient by Nick O'Leary
 *    2. MPU6050 by Electronic Cats
 *    3. ArduinoJson by Benoit Blanchon
 *    4. I2Cdev (dependency MPU6050)
 * ============================================================
 *  WIRING:
 *    MPU6050 SDA → GPIO 21 (ESP32)
 *    MPU6050 SCL → GPIO 22 (ESP32)
 *    MPU6050 VCC → 3.3V
 *    MPU6050 GND → GND
 *    LDR         → GPIO 34 (ADC, voltage divider ke 3.3V + resistor 10kΩ)
 *    Buzzer (+)  → GPIO 26
 *    Buzzer (-)  → GND
 * ============================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <MPU6050.h>

// ============================================================
//  KONFIGURASI - GANTI SESUAI KEBUTUHAN
// ============================================================
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

const char* MQTT_BROKER   = "broker.emqx.io";
const int   MQTT_PORT     = 1883;
const char* MQTT_PUB_TOPIC = "iot/pulsebadge/sensors";
const char* MQTT_SUB_TOPIC = "iot/pulsebadge/commands";

// Client ID unik (agar tidak konflik di broker publik)
const char* MQTT_CLIENT_ID = "ESP32_WearableBadge_001";

// ============================================================
//  KONFIGURASI PIN
// ============================================================
#define PIN_LDR     34   // ADC input untuk LDR (tidak bisa jadi output)
#define PIN_BUZZER  26   // GPIO untuk buzzer aktif
#define PIN_LED     2    // LED onboard ESP32 (opsional, status indicator)

// ============================================================
//  KONFIGURASI INTERVAL
// ============================================================
#define SEND_INTERVAL_MS  200   // Kirim data setiap 200ms (5 paket/detik)
#define WIFI_RETRY_DELAY  500
#define MQTT_RETRY_DELAY  2000

// ============================================================
//  OBJEK GLOBAL
// ============================================================
WiFiClient   espClient;
PubSubClient mqttClient(espClient);
MPU6050      mpu;

// State buzzer
bool buzzerActive   = false;
bool buzzerEnabled  = true;
bool optimizationMode = true;

// Timer
unsigned long lastSendTime = 0;
unsigned long lastBuzzerBeep = 0;

// ============================================================
//  FUNGSI: Koneksi WiFi
// ============================================================
void connectWiFi() {
  Serial.print("[WiFi] Menghubungkan ke: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retry = 0;

  while (WiFi.status() != WL_CONNECTED && retry < 40) {
    delay(WIFI_RETRY_DELAY);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] ✓ Terhubung!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] ✗ Gagal terhubung. Restart...");
    ESP.restart();
  }
}

// ============================================================
//  FUNGSI: Callback MQTT (terima command dari backend)
// ============================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("[MQTT] Gagal parse JSON: ");
    Serial.println(error.c_str());
    return;
  }

  Serial.print("[MQTT] Command diterima dari topic: ");
  Serial.println(topic);

  // Handle command: buzzer on/off
  if (doc.containsKey("buzzer")) {
    bool newBuzzerState = doc["buzzer"].as<bool>();
    if (newBuzzerState && buzzerEnabled) {
      buzzerActive = true;
      Serial.println("[ALERT] Buzzer AKTIF! Waktunya berdiri dan stretching!");
    } else {
      buzzerActive = false;
      digitalWrite(PIN_BUZZER, LOW);
      Serial.println("[ALERT] Buzzer DIMATIKAN.");
    }
  }

  // Handle command: buzzer_enabled (aktifkan/nonaktifkan fitur buzzer)
  if (doc.containsKey("buzzer_enabled")) {
    buzzerEnabled = doc["buzzer_enabled"].as<bool>();
    if (!buzzerEnabled) {
      buzzerActive = false;
      digitalWrite(PIN_BUZZER, LOW);
    }
    Serial.print("[CONFIG] Buzzer fitur: ");
    Serial.println(buzzerEnabled ? "AKTIF" : "NONAKTIF");
  }

  // Handle command: optimization mode
  if (doc.containsKey("optimization")) {
    optimizationMode = doc["optimization"].as<bool>();
    Serial.print("[CONFIG] Mode Optimasi Baterai: ");
    Serial.println(optimizationMode ? "ON" : "OFF");
  }

  // Handle command: sync request
  if (doc.containsKey("sync")) {
    Serial.println("[EVENT] Sync request diterima - mengirim data burst...");
    // Data akan dikirim pada iterasi berikutnya
  }
}

// ============================================================
//  FUNGSI: Koneksi / Reconnect MQTT
// ============================================================
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Menghubungkan ke broker...");
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println(" ✓ Terhubung!");
      mqttClient.subscribe(MQTT_SUB_TOPIC);
      Serial.print("[MQTT] Subscribe ke topic: ");
      Serial.println(MQTT_SUB_TOPIC);
      // Nyalakan LED sebagai indikator berhasil konek
      digitalWrite(PIN_LED, HIGH);
    } else {
      Serial.print(" ✗ Gagal (rc=");
      Serial.print(mqttClient.state());
      Serial.println("). Coba lagi...");
      digitalWrite(PIN_LED, LOW);
      delay(MQTT_RETRY_DELAY);
    }
  }
}

// ============================================================
//  FUNGSI: Baca Level Baterai (estimasi dari ADC)
// ============================================================
int readBatteryPercent() {
  // ESP32 bisa baca tegangan baterai jika dihubungkan via voltage divider ke GPIO 35
  // Gunakan pin ADC 35 jika ingin baca baterai nyata
  // Saat ini menggunakan estimasi sederhana (bisa dikembangkan)
  // Range tegangan Li-Po: 3.0V (0%) - 4.2V (100%)
  // Dengan voltage divider 1:2, tegangan masuk ADC: 1.5V - 2.1V
  // ADC ESP32 12-bit: 0 - 4095, Vref = 3.3V
  
  // Placeholder: kembalikan nilai baterai simulasi
  // Ganti dengan analogRead(35) jika ada rangkaian voltage divider
  static int simBattery = 85;
  static unsigned long lastDrain = 0;
  
  // Simulasi drain baterai perlahan (setiap 60 detik berkurang 1%)
  if (millis() - lastDrain > 60000) {
    if (simBattery > 10) simBattery--;
    lastDrain = millis();
  }
  return simBattery;
}

// ============================================================
//  FUNGSI: Konversi ADC LDR ke nilai Lux
// ============================================================
int readLux() {
  int adcVal = analogRead(PIN_LDR);  // 0 - 4095
  // Konversi: ADC tinggi = resistansi LDR rendah = cahaya terang
  // Mapping sederhana: 0 ADC = Gelap (Lux 0), 4095 ADC = Terang (Lux 400)
  int lux = map(adcVal, 0, 4095, 0, 400);
  return lux;
}

// ============================================================
//  FUNGSI: Handle Buzzer (beep pattern)
// ============================================================
void handleBuzzer() {
  if (buzzerActive && buzzerEnabled) {
    unsigned long now = millis();
    // Pola beep: ON 300ms, OFF 300ms
    long cyclePos = now % 600;
    if (cyclePos < 300) {
      digitalWrite(PIN_BUZZER, HIGH);
    } else {
      digitalWrite(PIN_BUZZER, LOW);
    }
  } else {
    digitalWrite(PIN_BUZZER, LOW);
  }
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n============================================");
  Serial.println("  Smart Wearable Badge - ESP32 Firmware");
  Serial.println("============================================");

  // Setup pins
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED, LOW);

  // Init I2C dan MPU6050
  Wire.begin(21, 22);  // SDA=21, SCL=22
  Serial.print("[MPU6050] Inisialisasi...");
  mpu.initialize();

  if (mpu.testConnection()) {
    Serial.println(" ✓ OK!");
  } else {
    Serial.println(" ✗ GAGAL! Cek wiring MPU6050.");
  }

  // Kalibrasi MPU6050 (offset agar lebih akurat)
  mpu.setXAccelOffset(0);
  mpu.setYAccelOffset(0);
  mpu.setZAccelOffset(0);
  mpu.setXGyroOffset(0);
  mpu.setYGyroOffset(0);
  mpu.setZGyroOffset(0);

  // Koneksi WiFi
  connectWiFi();

  // Setup MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(60);

  Serial.println("[SYSTEM] Setup selesai. Mulai mengirim data...\n");
}

// ============================================================
//  LOOP UTAMA
// ============================================================
void loop() {
  // Cek & reconnect WiFi jika terputus
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Koneksi terputus. Reconnecting...");
    connectWiFi();
  }

  // Cek & reconnect MQTT jika terputus
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();  // Wajib dipanggil untuk proses MQTT

  // Handle buzzer
  handleBuzzer();

  // Kirim data sensor setiap SEND_INTERVAL_MS
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // ---- Baca MPU6050 ----
    int16_t ax_raw, ay_raw, az_raw;
    int16_t gx_raw, gy_raw, gz_raw;
    mpu.getMotion6(&ax_raw, &ay_raw, &az_raw, &gx_raw, &gy_raw, &gz_raw);

    // Konversi ke unit SI:
    // Accelerometer: ±2g range → sensitivitas 16384 LSB/g, kalikan 9.81 untuk m/s²
    float Ax = (ax_raw / 16384.0f) * 9.81f;
    float Ay = (ay_raw / 16384.0f) * 9.81f;
    float Az = (az_raw / 16384.0f) * 9.81f;

    // Gyroscope: ±250°/s range → sensitivitas 131 LSB/°/s
    float Gx = gx_raw / 131.0f;
    float Gy = gy_raw / 131.0f;
    float Gz = gz_raw / 131.0f;

    // ---- Baca LDR ----
    int lux = readLux();

    // ---- Baca Baterai ----
    int battery = readBatteryPercent();

    // ---- Buat JSON Payload ----
    StaticJsonDocument<256> doc;
    doc["Ax"] = round(Ax * 1000.0f) / 1000.0f;  // 3 desimal
    doc["Ay"] = round(Ay * 1000.0f) / 1000.0f;
    doc["Az"] = round(Az * 1000.0f) / 1000.0f;
    doc["Gx"] = round(Gx * 100.0f) / 100.0f;
    doc["Gy"] = round(Gy * 100.0f) / 100.0f;
    doc["Gz"] = round(Gz * 100.0f) / 100.0f;
    doc["Lux"] = lux;
    doc["battery"] = battery;

    // Serialize ke string
    char jsonBuffer[256];
    serializeJson(doc, jsonBuffer);

    // ---- Publish ke MQTT ----
    if (mqttClient.publish(MQTT_PUB_TOPIC, jsonBuffer)) {
      // Log setiap 25 paket agar tidak spam Serial Monitor
      static int packetCount = 0;
      packetCount++;
      if (packetCount % 25 == 0) {
        Serial.print("[TX] Paket #");
        Serial.print(packetCount);
        Serial.print(" | Ax:");
        Serial.print(Ax, 2);
        Serial.print(" | Lux:");
        Serial.print(lux);
        Serial.print(" | Batt:");
        Serial.print(battery);
        Serial.println("%");
      }
    } else {
      Serial.println("[TX] ✗ Gagal publish MQTT!");
    }
  }
}
