import os
import json
import time
from datetime import datetime
import threading
import pandas as pd
import pickle

from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt

# Import Database models (Pastikan file database.py tetap ada)
from database import init_db, SessionLocal, CurrentStatus, ActivityHistory

init_db()

app = Flask(__name__)
CORS(app)

# ========================================================
# KREDENSIAL HIVEMQ CLOUD (WAJIB DIISI SESUAI MILIKMU!)
# ========================================================
MQTT_BROKER = "84d506e218eb46569ba9a4b406fedd66.s1.eu.hivemq.cloud" 
MQTT_PORT = 8883
MQTT_USER = "Kelompok13IoT"            # ISI DENGAN USERNAME HIVEMQ
MQTT_PASS = "Kelompok13IoT"            # ISI DENGAN PASSWORD HIVEMQ

MQTT_SUB_TOPIC = "proyek_iot/wearable_badge/data"
MQTT_PUB_TOPIC = "proyek_iot/wearable_badge/commands"

mqtt_connected = False
mqtt_ping_time = 12

# ========================================================
# 1. LOAD MODEL AI BUATANMU SENDIRI
# ========================================================
models = {}
models_loaded = False

try:
    print("Memuat Otak AI (model_rf_wearable.pkl)...")
    with open('model_rf_wearable.pkl', 'rb') as f:
        models['rf_model'] = pickle.load(f)
    models_loaded = True
    print("✅ Model AI Tahan Banting berhasil dimuat!")
except Exception as e:
    print(f"WARNING: Gagal memuat model. Pastikan file .pkl ada di folder yang sama. Detail: {e}")


# ========================================================
# 2. FUNGSI TEBAK AKTIVITAS (LANGSUNG TANPA WINDOWING)
# ========================================================
def run_ml_classification(payload):
    if not models_loaded:
        return "TIDAK_ADA_MODEL"

    # Susun data persis seperti saat AI dilatih
    df = pd.DataFrame([{
        'Accel_X': payload['accel_x'],
        'Accel_Y': payload['accel_y'],
        'Accel_Z': payload['accel_z'],
        'LDR': payload['ldr']
    }])
    
    try:
        hasil_tebakan = models['rf_model'].predict(df)[0]
        return hasil_tebakan
    except Exception as e:
        print(f"Error saat AI menebak: {e}")
        return "ERROR"


# ========================================================
# 3. FUNGSI UPDATE DATABASE & LOGIKA ALARM
# ========================================================
def update_telemetry_database(prediction, ldr_value, battery=100, time_since_last_sec=1.0):
    session = SessionLocal()
    try:
        status = session.query(CurrentStatus).filter_by(id=1).first()
        if not status:
            return
            
        status.last_update = datetime.now().strftime("%I:%M %p")
        status.activity_prediction = prediction
        status.ldr_value = int(ldr_value)
        status.battery = int(battery)
        
        # Logika Sedenter: Jika tebakan AI adalah "SEDENTER"
        if prediction == 'SEDENTER':
            # Tambah waktu diam (konversi detik ke menit)
            status.sedentary_minutes += int(round(time_since_last_sec / 60.0))
        else:
            # Jika gerak atau tidur, reset timer sedenter
            if prediction in ['AKTIF', 'TIDUR_NYENYAK', 'ALAT_DILEPAS']:
                status.sedentary_minutes = 0
        
        # Alarm Buzzer: Jika terlalu lama sedenter (misal 50 menit)
        if status.sedentary_minutes >= 50 and status.buzzer_active == 0:
            status.buzzer_active = 1
            publish_mqtt_command({"buzzer": True})
            print("ALERT: Kelamaan duduk! Perintah Buzzer ON dikirim.")
            
        session.commit()
        
        # Simpan History ke Database
        history = ActivityHistory(
            timestamp=datetime.now().strftime("%H:%M:%S"),
            prediction=prediction,
            ldr_value=int(ldr_value),
            ax_std=0.0 # Fitur std dihapus agar enteng, set ke 0
        )
        session.add(history)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Error Update Database: {e}")
    finally:
        session.close()


# ========================================================
# 4. MQTT CALLBACKS & KOMUNIKASI
# ========================================================
def publish_mqtt_command(command_dict):
    global mqtt_connected
    if mqtt_connected:
        try:
            mqtt_client.publish(MQTT_PUB_TOPIC, json.dumps(command_dict))
        except Exception as e:
            print(f"MQTT Publish gagal: {e}")

def on_connect(client, userdata, flags, rc, properties=None):
    global mqtt_connected
    if rc == 0:
        mqtt_connected = True
        print(f"✅ Berhasil Konek ke HiveMQ Cloud: {MQTT_BROKER}")
        client.subscribe(MQTT_SUB_TOPIC)
    else:
        mqtt_connected = False
        print(f"❌ MQTT Gagal Konek! Kode Error: {rc}")

def on_disconnect(client, userdata, rc, properties=None):
    global mqtt_connected
    mqtt_connected = False
    print("🔌 Terputus dari HiveMQ")

def on_message(client, userdata, msg):
    global mqtt_ping_time
    try:
        payload = json.loads(msg.payload.decode('utf-8'))
        mqtt_ping_time = int((time.time() * 1000) % 15 + 8)
        
        # Pastikan data yang masuk adalah format ESP32 buatanmu
        req_keys = ['accel_x', 'accel_y', 'accel_z', 'ldr']
        if not all(k in payload for k in req_keys):
            return
            
        # 1. Tebak status pakai AI
        prediction = run_ml_classification(payload)
        
        # 2. Print ke terminal biar kelihatan prosesnya
        print(f"Data Masuk -> X: {payload['accel_x']} | LDR: {payload['ldr']} ==> AI Menebak: {prediction}")
        
        # 3. Masukkan ke Database (Battery set statis 100 karena ESP32 belum kirim data baterai)
        update_telemetry_database(
            prediction=prediction,
            ldr_value=payload['ldr'],
            battery=100, 
            time_since_last_sec=1.0 
        )
    except Exception as e:
        pass # Abaikan error parsing agar server tidak crash

mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
# SETTING KEAMANAN (WAJIB UNTUK HIVEMQ)
mqtt_client.tls_set()
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)

mqtt_client.on_connect = on_connect
mqtt_client.on_disconnect = on_disconnect
mqtt_client.on_message = on_message

def start_mqtt_thread():
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
    except Exception as e:
        print(f"Gagal memulai MQTT: {e}")

threading.Thread(target=start_mqtt_thread, daemon=True).start()


# ========================================================
# 5. REST APIs UNTUK REACT FRONTEND
# ========================================================
@app.route('/api/status', methods=['GET'])
def get_status():
    session = SessionLocal()
    try:
        status = session.query(CurrentStatus).filter_by(id=1).first()
        if not status:
            return jsonify({"error": "No status found"}), 404
            
        return jsonify({
            "activity": status.activity_prediction,
            "sedentary_minutes": status.sedentary_minutes,
            "ldr_value": status.ldr_value,
            "battery": status.battery,
            "optimization_mode": bool(status.optimization_mode),
            "buzzer_active": bool(status.buzzer_active),
            "last_update": status.last_update,
            "mqtt_connected": mqtt_connected,
            "mqtt_ping": mqtt_ping_time
        })
    finally:
        session.close()

@app.route('/api/dismiss', methods=['POST'])
def dismiss_alert():
    session = SessionLocal()
    try:
        status = session.query(CurrentStatus).filter_by(id=1).first()
        if status:
            status.sedentary_minutes = 0
            status.buzzer_active = 0
            session.commit()
            publish_mqtt_command({"buzzer": False})
            return jsonify({"status": "success", "message": "Alert dismissed, buzzer OFF sent."})
        return jsonify({"error": "No status found"}), 404
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route('/api/settings/buzzer', methods=['POST'])
def toggle_buzzer_setting():
    data = request.json or {}
    enabled = data.get('enabled', True)
    publish_mqtt_command({"buzzer_enabled": enabled})
    return jsonify({"status": "success", "buzzer_enabled": enabled})

@app.route('/api/settings/optimization', methods=['POST'])
def toggle_optimization():
    data = request.json or {}
    enabled = data.get('enabled', True)
    session = SessionLocal()
    try:
        status = session.query(CurrentStatus).filter_by(id=1).first()
        if status:
            status.optimization_mode = 1 if enabled else 0
            session.commit()
            publish_mqtt_command({"optimization": enabled})
            return jsonify({"status": "success", "optimization_mode": enabled})
        return jsonify({"error": "No status found"}), 404
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route('/api/sync', methods=['POST'])
def force_sync():
    publish_mqtt_command({"sync": True})
    return jsonify({"status": "success", "time": datetime.now().strftime("%I:%M %p")})

@app.route('/api/history', methods=['GET'])
def get_history():
    session = SessionLocal()
    try:
        records = session.query(ActivityHistory).order_by(ActivityHistory.id.desc()).limit(30).all()
        records = list(reversed(records))
        history_list = []
        for r in records:
            history_list.append({
                "id": r.id,
                "timestamp": r.timestamp,
                "prediction": r.prediction,
                "ldr_value": r.ldr_value,
                "ax_std": r.ax_std
            })
        return jsonify(history_list)
    finally:
        session.close()

@app.route('/api/sleep-analysis', methods=['GET'])
def get_sleep_analysis():
    # Menyesuaikan logika tidur berdasarkan label TIDUR_NYENYAK
    session = SessionLocal()
    try:
        sleep_records = session.query(ActivityHistory).filter(
            ActivityHistory.prediction == 'TIDUR_NYENYAK'
        ).all()
        
        total_tidur = len(sleep_records)
        if total_tidur >= 10:
            duration_hours = round(total_tidur * 10 / 60, 1)
            score = 90
            efficiency = 95
        else:
            duration_hours = 0
            score = 0
            efficiency = 0
            
        return jsonify({
            "score": score,
            "duration_str": f"{int(duration_hours)}h {int((duration_hours % 1) * 60)}m",
            "efficiency": f"{efficiency}%",
            "stages": {
                "light": 20,
                "deep": 80,
                "rem": 0
            }
        })
    finally:
        session.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)