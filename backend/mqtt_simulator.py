import time
import json
import random
import threading
import pandas as pd
import paho.mqtt.client as mqtt

# MQTT configurations
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_SUB_TOPIC = "iot/pulsebadge/commands"
MQTT_PUB_TOPIC = "iot/pulsebadge/sensors"

# Simulated Hardware States
battery = 85
buzzer_sounding = False
buzzer_enabled = True
optimization_mode = True
running = True

# Load real dataset samples for simulation
print("Loading datasets for simulation...")
try:
    cols = ['Ax','Ay','Az','Gx','Gy','Gz']
    # Load some Sitting data
    df_all = pd.read_csv('machine-learning/Dataset/dataset1.csv')
    df_sitting = df_all[df_all['Activity'] == 'Sitting'][cols].reset_index(drop=True)
    df_walking = df_all[df_all['Activity'] == 'Walking'][cols].reset_index(drop=True)
    
    # Load Sleep data
    df_sleep = pd.read_csv('backend/models/synthetic_sleep_data.csv')
    print("Simulated dataset segments loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load local CSVs for high-fidelity simulation: {e}")
    # Fallback to generating mock data if files missing
    df_sitting = pd.DataFrame({'Ax': [0.1]*100, 'Ay': [0.1]*100, 'Az': [9.8]*100, 'Gx': [0.0]*100, 'Gy': [0.0]*100, 'Gz': [0.0]*100})
    df_walking = pd.DataFrame({'Ax': [1.5]*100, 'Ay': [2.0]*100, 'Az': [11.0]*100, 'Gx': [20.0]*100, 'Gy': [15.0]*100, 'Gz': [10.0]*100})
    df_sleep = pd.DataFrame({'Ax': [0.05]*100, 'Ay': [0.05]*100, 'Az': [9.8]*100, 'Gx': [0.0]*100, 'Gy': [0.0]*100, 'Gz': [0.0]*100, 'Lux': [5.0]*100, 'Sleep_Stage': ['Light_Sleep']*100})

# MQTT Callbacks
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("[SIMULATOR] Connected to MQTT broker!")
        client.subscribe(MQTT_SUB_TOPIC)
    else:
        print(f"[SIMULATOR] Connection failed with code {rc}")

def on_message(client, userdata, msg):
    global buzzer_sounding, buzzer_enabled, optimization_mode
    try:
        command = json.loads(msg.payload.decode('utf-8'))
        print(f"[SIMULATOR] Received Command: {command}")
        
        if "buzzer" in command:
            new_buzzer_state = command["buzzer"]
            if new_buzzer_state and buzzer_enabled:
                buzzer_sounding = True
                print("[SOUND] [SIMULATOR ALERT] BUZZER IS BEEPING! STAND UP AND STRETCH!")
            else:
                buzzer_sounding = False
                print("[MUTE] [SIMULATOR ALERT] BUZZER IS SILENCED.")
                
        if "buzzer_enabled" in command:
            buzzer_enabled = command["buzzer_enabled"]
            print(f"[SIMULATOR CONFIG] Buzzer alarm feature: {'ENABLED' if buzzer_enabled else 'DISABLED'}")
            if not buzzer_enabled:
                buzzer_sounding = False
                
        if "optimization" in command:
            optimization_mode = command["optimization"]
            print(f"[SIMULATOR CONFIG] Battery optimization: {'ON' if optimization_mode else 'OFF'}")
            
        if "sync" in command:
            print("[SIMULATOR EVENT] Manual sync requested. Sending telemetry burst...")
    except Exception as e:
        print(f"[SIMULATOR ERROR] Failed to process command: {e}")

# Telemetry Publisher Thread
def telemetry_publisher(client):
    global battery, buzzer_sounding, running
    
    # We will simulate a sequence of events:
    # 1. 40 seconds of SITTING (increases sedentary minutes on backend)
    # 2. 20 seconds of WALKING (resets sedentary minutes)
    # 3. 30 seconds of SLEEPING (low light, cycles sleep stages)
    # Then loop back!
    
    modes = ['SITTING', 'WALKING', 'SLEEPING']
    mode_idx = 0
    mode_start = time.time()
    
    sitting_ptr = 0
    walking_ptr = 0
    sleep_ptr = 0
    
    print("\n=======================================================")
    print("[RUNNING] IoT SIMULATOR RUNNING: Press Ctrl+C to terminate.")
    print("=======================================================\n")
    
    while running:
        current_time = time.time()
        elapsed = current_time - mode_start
        
        # Determine mode based on time scenario
        current_mode = modes[mode_idx]
        
        # Transition rules
        if current_mode == 'SITTING' and elapsed > 45:
            mode_idx = 1
            mode_start = time.time()
            current_mode = 'WALKING'
            print("\n*** [SIMULATOR EVENT] User gets up! Transitioning to WALKING scenario...")
        elif current_mode == 'WALKING' and elapsed > 20:
            mode_idx = 2
            mode_start = time.time()
            current_mode = 'SLEEPING'
            print("\n*** [SIMULATOR EVENT] Night falls. Transitioning to SLEEPING scenario (Low Light)...")
        elif current_mode == 'SLEEPING' and elapsed > 30:
            mode_idx = 0
            mode_start = time.time()
            current_mode = 'SITTING'
            print("\n*** [SIMULATOR EVENT] Morning wake up. Transitioning to SITTING scenario...")
            
        # Get sensor sample based on current mode
        payload = {}
        if current_mode == 'SITTING':
            sample = df_sitting.iloc[sitting_ptr % len(df_sitting)]
            sitting_ptr += 1
            payload = {
                "Ax": float(sample['Ax']),
                "Ay": float(sample['Ay']),
                "Az": float(sample['Az']),
                "Gx": float(sample['Gx']),
                "Gy": float(sample['Gy']),
                "Gz": float(sample['Gz']),
                "Lux": int(random.normalvariate(200, 10)),  # Bright daytime light
                "battery": battery
            }
        elif current_mode == 'WALKING':
            sample = df_walking.iloc[walking_ptr % len(df_walking)]
            walking_ptr += 1
            payload = {
                "Ax": float(sample['Ax']),
                "Ay": float(sample['Ay']),
                "Az": float(sample['Az']),
                "Gx": float(sample['Gx']),
                "Gy": float(sample['Gy']),
                "Gz": float(sample['Gz']),
                "Lux": int(random.normalvariate(180, 15)),
                "battery": battery
            }
        elif current_mode == 'SLEEPING':
            # Sleep stage data has 'Lux' in the sleep dataframe
            sample = df_sleep.iloc[sleep_ptr % len(df_sleep)]
            sleep_ptr += 1
            payload = {
                "Ax": float(sample['Ax']),
                "Ay": float(sample['Ay']),
                "Az": float(sample['Az']),
                "Gx": float(sample['Gx']),
                "Gy": float(sample['Gy']),
                "Gz": float(sample['Gz']),
                "Lux": max(0, int(sample['Lux'])),  # Low light
                "battery": battery
            }
            
        # Drain battery slowly (depends on optimization mode)
        if random.random() < (0.01 if optimization_mode else 0.03):
            battery = max(10, battery - 1)
            
        # Add buzzer audio beep simulation logs
        if buzzer_sounding and buzzer_enabled:
            print("[BEEP] BEEP! BEEP! (Stand Alert!)")
            
        # Publish sensor packet via MQTT
        try:
            client.publish(MQTT_PUB_TOPIC, json.dumps(payload))
            # Output abbreviated logs to not spam the terminal
            if sitting_ptr % 10 == 0 or walking_ptr % 10 == 0 or sleep_ptr % 10 == 0:
                print(f"[SIMULATOR STATE] Mode: {current_mode} | Lux: {payload['Lux']} | Batt: {battery}% | Alert Sounding: {buzzer_sounding}")
        except Exception as e:
            print(f"[SIMULATOR ERROR] Publish failed: {e}")
            
        # Sleep for 200ms per sample packet (5 packets/second)
        time.sleep(0.2)

# Start simulator client
client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    
    # Start publisher thread
    pub_thread = threading.Thread(target=telemetry_publisher, args=(client,))
    pub_thread.daemon = True
    pub_thread.start()
    
    # Keep main thread alive
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down MQTT Simulator...")
    running = False
    client.loop_stop()
except Exception as e:
    print(f"Simulator error: {e}")
