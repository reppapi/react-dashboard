import json
import pandas as pd
import paho.mqtt.client as mqtt
import time

# --- 1. GANTI LABEL INI SESUAI AKTIVITAS YANG LAGI KAMU PERAGAKAN ---
LABEL_SEKARANG = "SEDENTER"
NAMA_FILE_CSV = "data_sedenter_laptop3.csv"
# -------------------------------------------------------------------

MQTT_BROKER = "84d506e218eb46569ba9a4b406fedd66.s1.eu.hivemq.cloud" # Isi samain kayak di ai_backend.py
MQTT_PORT = 8883
MQTT_USER = "Kelompok13IoT"            # Isi samain kayak di ai_backend.py
MQTT_PASS = "Kelompok13IoT"            # Isi samain kayak di ai_backend.py
TOPIC = "proyek_iot/wearable_badge/data"

dataset = []

def on_connect(client, userdata, flags, rc):
    print(f"🎥 MULAI MEREKAM GAYA: {LABEL_SEKARANG}...")
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    payload = json.loads(msg.payload.decode('utf-8'))
    print(f"Terekam -> X: {payload['accel_x']} | Y: {payload['accel_y']} | Z: {payload['accel_z']} | LDR: {payload['ldr']}")
    
    dataset.append({
        'Accel_X': payload['accel_x'],
        'Accel_Y': payload['accel_y'],
        'Accel_Z': payload['accel_z'],
        'LDR': payload['ldr'],
        'Label': LABEL_SEKARANG
    })

client = mqtt.Client()
client.tls_set()
client.username_pw_set(MQTT_USER, MQTT_PASS)
client.on_connect = on_connect
client.on_message = on_message

client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Jalankan perekaman di background
client.loop_start()

# Rekam selama 3 Menit (180 detik)
try:
    for i in range(300, 0, -1):
        print(f"Sisa waktu rekam: {i} detik", end="\r")
        time.sleep(1)
except KeyboardInterrupt:
    print("\nPerekaman dihentikan manual.")

client.loop_stop()

# Simpan ke CSV
df = pd.DataFrame(dataset)
df.to_csv(NAMA_FILE_CSV, index=False)
print(f"\n✅ Selesai! {len(dataset)} baris data berhasil disimpan ke {NAMA_FILE_CSV}")