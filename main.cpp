#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ThreeWire.h>  
#include <RtcDS1302.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // <-- TAMBAHAN UNTUK CLOUD: Library untuk koneksi aman
#include <PubSubClient.h>

// --- Konfigurasi Wi-Fi & MQTT ---
const char* ssid = "FPMIPA-C-Lt1";
const char* password = "mipacelt01";

// --- UBAH BAGIAN INI SESUAI HIVEMQ CLOUD KAMU ---
const char* mqtt_server = "84d506e218eb46569ba9a4b406fedd66.s1.eu.hivemq.cloud"; // Salin dari Cluster URL
const int mqtt_port = 8883; // <-- TAMBAHAN UNTUK CLOUD: Port berubah jadi 8883
const char* mqtt_user = "Kelompok13IoT"; // Salin dari Access Management
const char* mqtt_pass = "Kelompok13IoT"; // Salin dari Access Management

const char* mqtt_topic = "proyek_iot/wearable_badge/data";

// <-- TAMBAHAN UNTUK CLOUD: Gunakan WiFiClientSecure
WiFiClientSecure espClient; 
PubSubClient client(espClient);

// --- Inisialisasi Objek Sensor ---
Adafruit_MPU6050 mpu;
ThreeWire myWire(27, 14, 26); 
RtcDS1302<ThreeWire> Rtc(myWire);

const int LDR_PIN = 32;     
const int BUZZER_PIN = 23;  
const int BUTTON_PIN = 4;   

void setup_wifi() {
  delay(10);

  Serial.println();
  Serial.print("Menghubungkan ke Wi-Fi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int count = 0;

  while (WiFi.status() != WL_CONNECTED && count < 30) {
    delay(500);
    Serial.print(".");
    count++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Terhubung!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nGAGAL CONNECT WIFI!");
    Serial.print("Status WiFi: ");
    Serial.println(WiFi.status());
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Mencoba koneksi MQTT...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // <-- TAMBAHAN UNTUK CLOUD: Masukkan Username dan Password saat connect
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) { 
      Serial.println("Berhasil Terhubung ke Broker MQTT Privat!");
    } else {
      Serial.print("Gagal, status=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LDR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(BUZZER_PIN, HIGH); delay(150); digitalWrite(BUZZER_PIN, LOW);
  delay(150);
  digitalWrite(BUZZER_PIN, HIGH); delay(150); digitalWrite(BUZZER_PIN, LOW);

  setup_wifi();

  // <-- TAMBAHAN UNTUK CLOUD: Matikan pengecekan sertifikat SSL agar lebih mudah connect
  espClient.setInsecure(); 
  
  // <-- TAMBAHAN UNTUK CLOUD: Gunakan variabel mqtt_port (8883)
  client.setServer(mqtt_server, mqtt_port); 

  if (!mpu.begin()) {
    Serial.println("Gagal menemukan MPU6050!");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  }

  Rtc.Begin();
  if (!Rtc.IsDateTimeValid()) {
    Rtc.SetDateTime(RtcDateTime(__DATE__, __TIME__));
  }
  if (Rtc.GetIsWriteProtected()) {
    Rtc.SetIsWriteProtected(false);
  }
  if (!Rtc.GetIsRunning()) {
    Rtc.SetIsRunning(true);
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); 

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  int ldrValue = analogRead(LDR_PIN);
  RtcDateTime now = Rtc.GetDateTime();
  int buttonState = digitalRead(BUTTON_PIN);

  char waktuStr[10];
  sprintf(waktuStr, "%02d:%02d:%02d", now.Hour(), now.Minute(), now.Second());

  Serial.print("Waktu: "); Serial.print(waktuStr);
  Serial.print(" | Accel Z: "); Serial.print(a.acceleration.z, 2);
  Serial.print(" | LDR: "); Serial.print(ldrValue);
  Serial.println();

  String jsonPayload = "{";
  jsonPayload += "\"waktu\":\"" + String(waktuStr) + "\",";
  jsonPayload += "\"accel_x\":" + String(a.acceleration.x, 2) + ",";
  jsonPayload += "\"accel_y\":" + String(a.acceleration.y, 2) + ",";
  jsonPayload += "\"accel_z\":" + String(a.acceleration.z, 2) + ",";
  jsonPayload += "\"ldr\":" + String(ldrValue) + ",";
  jsonPayload += "\"cetekan\":\"" + String(buttonState == LOW ? "AKTIF" : "MATI") + "\"";
  jsonPayload += "}";

  client.publish(mqtt_topic, jsonPayload.c_str());

  if (buttonState == LOW) {
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  delay(1000); 
}