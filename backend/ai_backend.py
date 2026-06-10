import json
import pickle
import pandas as pd
import paho.mqtt.client as mqtt

# 1. Buka Otak AI-nya
print("Memuat otak AI (model_rf_wearable.pkl)...")
try:
    with open('model_rf_wearable.pkl', 'rb') as f:
        model = pickle.load(f)
except FileNotFoundError:
    print("Error: File model tidak ditemukan!")
    exit()

# 2. Konfigurasi Private Broker HiveMQ Cloud
MQTT_BROKER = "84d506e218eb46569ba9a4b406fedd66.s1.eu.hivemq.cloud" # <-- ISI DENGAN URL CLUSTERMU
MQTT_PORT = 8883
MQTT_USER = "Kelompok13IoT"            # <-- ISI DENGAN USERNAME HIVEMQ
MQTT_PASS = "Kelompok13IoT"            # <-- ISI DENGAN PASSWORD HIVEMQ

TOPIC_DATA_MENTAH = "proyek_iot/wearable_badge/data"
TOPIC_HASIL_AI = "proyek_iot/wearable_badge/status"

# Fungsi saat berhasil konek ke HiveMQ
def on_connect(client, userdata, flags, rc):
    print("✅ Backend AI Terhubung ke HiveMQ Cloud!")
    print(f"📡 Mendengarkan data mentah dari ESP32...\n")
    client.subscribe(TOPIC_DATA_MENTAH)

# Fungsi yang berjalan otomatis tiap kali ESP32 ngirim data
def on_message(client, userdata, msg):
    # Ekstrak data mentah dari ESP32
    payload = json.loads(msg.payload.decode('utf-8'))
    
    # Susun data agar sesuai dengan format yang dipelajari AI
    data_baru = pd.DataFrame([{
        'Accel_X': payload['accel_x'],
        'Accel_Y': payload['accel_y'],
        'Accel_Z': payload['accel_z'],
        'LDR': payload['ldr']
    }])
    
    # AI Menebak Status Aktivitas!
    hasil_tebakan = model.predict(data_baru)[0]
    
    print(f"Waktu: {payload['waktu']} | X: {payload['accel_x']} | LDR: {payload['ldr']} ==> AI Menebak: {hasil_tebakan}")
    
    # Bungkus hasil tebakan jadi JSON baru, kirim ke Dashboard React
    data_ke_frontend = {
        "waktu": payload['waktu'],
        "status_aktivitas": hasil_tebakan
    }
    client.publish(TOPIC_HASIL_AI, json.dumps(data_ke_frontend))

# 3. Setup Koneksi MQTT Aman (TLS)
client = mqtt.Client()
client.tls_set() 
client.username_pw_set(MQTT_USER, MQTT_PASS)

client.on_connect = on_connect
client.on_message = on_message

# 4. Mulai mendengarkan tanpa henti
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()
except Exception as e:
    print(f"Gagal konek: {e}")