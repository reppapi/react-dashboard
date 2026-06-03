"""
Digital Wellness Assistant - ML Pipeline
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib, json, warnings
warnings.filterwarnings('ignore')

print("="*60)
print("STEP 1: LOAD & COMBINE ALL DATASETS")
print("="*60)

COLS = ['Ax','Ay','Az','Gx','Gy','Gz','Activity']
dfs = []
for i in range(1, 6):
    df = pd.read_csv(f'machine-learning/Dataset/dataset{i}.csv')[COLS]
    dfs.append(df)
    print(f"  dataset{i}.csv: {len(df)} rows")

mpu = pd.read_csv('machine-learning/Dataset/MPU6050_Data.csv')[COLS]
print(f"  MPU6050_Data.csv: {len(mpu)} rows")

combined_all = pd.concat(dfs + [mpu], ignore_index=True)
print(f"\nTotal: {len(combined_all)} rows")
print("Activities:")
print(combined_all['Activity'].value_counts())

print("\n" + "="*60)
print("STEP 2: BALANCED SAMPLING + FEATURE ENGINEERING")
print("="*60)

# Balanced sampling - correct approach
activities = combined_all['Activity'].unique()
sampled_parts = []
for act in activities:
    subset = combined_all[combined_all['Activity'] == act]
    sampled_parts.append(subset.sample(min(len(subset), 12000), random_state=42))

sampled = pd.concat(sampled_parts, ignore_index=True)
print("After balancing:")
print(sampled['Activity'].value_counts())

def extract_features(segment):
    features = {}
    for ax in ['Ax','Ay','Az','Gx','Gy','Gz']:
        v = segment[ax].values.astype(float)
        features[f'{ax}_mean'] = np.mean(v)
        features[f'{ax}_std'] = np.std(v)
        features[f'{ax}_min'] = np.min(v)
        features[f'{ax}_max'] = np.max(v)
        features[f'{ax}_rms'] = np.sqrt(np.mean(v**2))
        features[f'{ax}_range'] = np.max(v) - np.min(v)
        features[f'{ax}_iqr'] = np.percentile(v, 75) - np.percentile(v, 25)
        features[f'{ax}_skew'] = float(pd.Series(v).skew())
        features[f'{ax}_kurt'] = float(pd.Series(v).kurtosis())
    
    acc_m = np.sqrt(sampled['Ax'][:1].values[0]**2)  # placeholder, will fix below
    Ax = segment['Ax'].values.astype(float)
    Ay = segment['Ay'].values.astype(float)
    Az = segment['Az'].values.astype(float)
    acc_m = np.sqrt(Ax**2 + Ay**2 + Az**2)
    features['acc_mag_mean'] = np.mean(acc_m)
    features['acc_mag_std'] = np.std(acc_m)
    
    Gx = segment['Gx'].values.astype(float)
    Gy = segment['Gy'].values.astype(float)
    Gz = segment['Gz'].values.astype(float)
    gyr_m = np.sqrt(Gx**2 + Gy**2 + Gz**2)
    features['gyro_mag_mean'] = np.mean(gyr_m)
    features['gyro_mag_std'] = np.std(gyr_m)
    features['svm'] = np.mean(np.abs(acc_m - 9.81))
    return features

WINDOW_SIZE = 50
STEP = 25
print(f"\nSliding window: size={WINDOW_SIZE}, step={STEP}")

window_features = []
for activity in activities:
    act_data = sampled[sampled['Activity'] == activity].reset_index(drop=True)
    act_data = act_data.drop('Activity', axis=1)  # drop label column before windowing
    count = 0
    for start in range(0, len(act_data) - WINDOW_SIZE, STEP):
        segment = act_data.iloc[start:start+WINDOW_SIZE]
        feats = extract_features(segment)
        feats['label'] = activity
        window_features.append(feats)
        count += 1
    print(f"  {activity}: {count} windows")

feat_df = pd.DataFrame(window_features)
print(f"\nFeature matrix: {feat_df.shape}")

print("\n" + "="*60)
print("STEP 3: SEDENTARY DETECTION MODEL (Binary)")
print("="*60)

feat_df['sedentary_label'] = feat_df['label'].apply(
    lambda x: 'Sedentary' if x in ['Sitting', 'Standing'] else 'Active'
)
print("Distribution:", feat_df['sedentary_label'].value_counts().to_dict())

feat_cols = [c for c in feat_df.columns if c not in ['label','sedentary_label']]
X_sed = feat_df[feat_cols].fillna(0).values
y_sed = feat_df['sedentary_label'].values

X_tr_s, X_te_s, y_tr_s, y_te_s = train_test_split(X_sed, y_sed, test_size=0.2, random_state=42, stratify=y_sed)
scaler_sed = StandardScaler()
X_tr_s = scaler_sed.fit_transform(X_tr_s)
X_te_s = scaler_sed.transform(X_te_s)

rf_sed = RandomForestClassifier(n_estimators=100, max_depth=15, n_jobs=-1, random_state=42)
rf_sed.fit(X_tr_s, y_tr_s)
y_pr_s = rf_sed.predict(X_te_s)
sed_acc = accuracy_score(y_te_s, y_pr_s)
print(f"Accuracy: {sed_acc*100:.2f}%")
print(classification_report(y_te_s, y_pr_s))

print("\n" + "="*60)
print("STEP 4: MULTI-CLASS ACTIVITY RECOGNITION MODEL")
print("="*60)

le_act = LabelEncoder()
y_act = le_act.fit_transform(feat_df['label'])
X_act = feat_df[feat_cols].fillna(0).values

X_tr_a, X_te_a, y_tr_a, y_te_a = train_test_split(X_act, y_act, test_size=0.2, random_state=42, stratify=y_act)
scaler_act = StandardScaler()
X_tr_a = scaler_act.fit_transform(X_tr_a)
X_te_a = scaler_act.transform(X_te_a)

rf_act = RandomForestClassifier(n_estimators=150, max_depth=20, n_jobs=-1, random_state=42)
rf_act.fit(X_tr_a, y_tr_a)
y_pr_a = rf_act.predict(X_te_a)
act_acc = accuracy_score(y_te_a, y_pr_a)
print(f"Accuracy: {act_acc*100:.2f}%")
print(classification_report(y_te_a, y_pr_a, target_names=le_act.classes_))

print("\n" + "="*60)
print("STEP 5: SYNTHETIC SLEEP DATASET")
print("="*60)

np.random.seed(42)
def gen_sleep(n, stage):
    p = {
        'Awake':       dict(ax=(0.5,0.8), ay=(0.3,0.6), az=(9.5,0.4), gx=(0,15), gy=(0,12), gz=(0,10), lux=(50,300)),
        'Light_Sleep': dict(ax=(0.1,0.3), ay=(0.05,0.2), az=(9.7,0.2), gx=(0,4),  gy=(0,3),  gz=(0,3),  lux=(0,20)),
        'Deep_Sleep':  dict(ax=(0.02,0.08), ay=(0.01,0.06), az=(9.8,0.1), gx=(0,1), gy=(0,1), gz=(0,0.8), lux=(0,5)),
        'REM_Sleep':   dict(ax=(0.08,0.15), ay=(0.06,0.12), az=(9.75,0.15), gx=(0,2), gy=(0,2), gz=(0,2), lux=(0,8)),
    }[stage]
    return pd.DataFrame({
        'Ax': np.random.normal(*p['ax'], n), 'Ay': np.random.normal(*p['ay'], n),
        'Az': np.random.normal(*p['az'], n), 'Gx': np.random.normal(*p['gx'], n),
        'Gy': np.random.normal(*p['gy'], n), 'Gz': np.random.normal(*p['gz'], n),
        'Lux': np.random.uniform(*p['lux'], n), 'Sleep_Stage': stage
    })

stages = {'Awake':750, 'Light_Sleep':2250, 'Deep_Sleep':1250, 'REM_Sleep':750}
sleep_df = pd.concat([gen_sleep(n,s) for s,n in stages.items()], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
import os
os.makedirs('backend/models', exist_ok=True)
sleep_df.to_csv('backend/models/synthetic_sleep_data.csv', index=False)
print(f"Sleep dataset: {sleep_df.shape}")
print(sleep_df['Sleep_Stage'].value_counts())

print("\n" + "="*60)
print("STEP 6: SLEEP QUALITY MODEL")
print("="*60)

def extract_sleep_features(seg):
    f = {}
    for ax in ['Ax','Ay','Az','Gx','Gy','Gz']:
        v = seg[ax].values.astype(float)
        f[f'{ax}_mean_abs'] = np.mean(np.abs(v))
        f[f'{ax}_std'] = np.std(v)
        f[f'{ax}_rms'] = np.sqrt(np.mean(v**2))
        f[f'{ax}_max_abs'] = np.max(np.abs(v))
    acc_m = np.sqrt(seg['Ax'].values**2 + seg['Ay'].values**2 + seg['Az'].values**2)
    f['acc_mag_mean'] = np.mean(acc_m)
    f['acc_mag_std'] = np.std(acc_m)
    f['motion_energy'] = np.sum(np.abs(acc_m - 9.81))
    f['lux_mean'] = np.mean(seg['Lux'].values)
    f['lux_std'] = np.std(seg['Lux'].values)
    return f

sleep_feats = []
for stage in stages.keys():
    sd = sleep_df[sleep_df['Sleep_Stage'] == stage].reset_index(drop=True)
    data_cols = sd.drop('Sleep_Stage', axis=1)
    for s in range(0, len(data_cols) - 50, 20):
        f = extract_sleep_features(data_cols.iloc[s:s+50])
        f['label'] = stage
        sleep_feats.append(f)

sleep_feat_df = pd.DataFrame(sleep_feats)
print(f"Sleep features: {sleep_feat_df.shape}")
print(sleep_feat_df['label'].value_counts())

le_sleep = LabelEncoder()
sleep_fcols = [c for c in sleep_feat_df.columns if c != 'label']
X_sl = sleep_feat_df[sleep_fcols].fillna(0).values
y_sl = le_sleep.fit_transform(sleep_feat_df['label'])

X_tr_sl, X_te_sl, y_tr_sl, y_te_sl = train_test_split(X_sl, y_sl, test_size=0.2, random_state=42, stratify=y_sl)
scaler_sleep = StandardScaler()
X_tr_sl = scaler_sleep.fit_transform(X_tr_sl)
X_te_sl = scaler_sleep.transform(X_te_sl)

rf_sleep = RandomForestClassifier(n_estimators=100, max_depth=15, n_jobs=-1, random_state=42)
rf_sleep.fit(X_tr_sl, y_tr_sl)
y_pr_sl = rf_sleep.predict(X_te_sl)
sleep_acc = accuracy_score(y_te_sl, y_pr_sl)
print(f"Sleep Model Accuracy: {sleep_acc*100:.2f}%")
print(classification_report(y_te_sl, y_pr_sl, target_names=le_sleep.classes_))

print("\n" + "="*60)
print("STEP 7: SAVE ALL MODELS")
print("="*60)

joblib.dump(rf_sed, 'backend/models/model_sedentary.pkl')
joblib.dump(scaler_sed, 'backend/models/scaler_sedentary.pkl')
joblib.dump(rf_act, 'backend/models/model_activity.pkl')
joblib.dump(scaler_act, 'backend/models/scaler_activity.pkl')
joblib.dump(le_act, 'backend/models/encoder_activity.pkl')
joblib.dump(rf_sleep, 'backend/models/model_sleep.pkl')
joblib.dump(scaler_sleep, 'backend/models/scaler_sleep.pkl')
joblib.dump(le_sleep, 'backend/models/encoder_sleep.pkl')

metadata = {
    'activity_features': feat_cols,
    'sleep_features': sleep_fcols,
    'activity_classes': list(le_act.classes_),
    'sleep_classes': list(le_sleep.classes_),
    'sedentary_classes': ['Sitting','Standing'],
    'window_size': WINDOW_SIZE,
    'step_size': STEP,
    'model_accuracy': {
        'sedentary': round(sed_acc*100,2),
        'activity': round(act_acc*100,2),
        'sleep': round(sleep_acc*100,2)
    }
}
with open('backend/models/model_metadata.json','w') as f:
    json.dump(metadata, f, indent=2)

print("\n[SUCCESS] ALL STEPS COMPLETE!")
print(f"  Sedentary Detection: {sed_acc*100:.2f}%")
print(f"  Activity Recognition: {act_acc*100:.2f}%")
print(f"  Sleep Quality: {sleep_acc*100:.2f}%")
print("\nSaved files:")
import os
for fn in ['model_sedentary.pkl','scaler_sedentary.pkl','model_activity.pkl','scaler_activity.pkl',
           'encoder_activity.pkl','model_sleep.pkl','scaler_sleep.pkl','encoder_sleep.pkl','model_metadata.json',
           'synthetic_sleep_data.csv']:
    size = os.path.getsize(f'backend/models/{fn}')
    print(f"  backend/models/{fn} ({size//1024} KB)")
