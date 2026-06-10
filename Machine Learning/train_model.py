import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import pickle

print("1. Membaca dan menggabungkan data syuting...")
try:
    # Membaca ke-4 file CSV
    df_sedenter = pd.read_csv('data_sedenter.csv')
    df_lepas = pd.read_csv('data_lepas.csv')
    df_aktif = pd.read_csv('data_aktif.csv')
    df_tidur = pd.read_csv('data_tidur.csv')
    
    df_aktif_2 = pd.read_csv('data_aktif_laptop2.csv')
    df_lepas_2 = pd.read_csv('data_lepas_laptop2.csv')
    df_sedenter_2 = pd.read_csv('data_sedenter_laptop2.csv')
    df_tidur_2 = pd.read_csv('data_tidur_laptop2.csv')

    df_sedenter_3 = pd.read_csv('data_sedenter_laptop3.csv')

    # Menggabungkan semuanya jadi satu tabel besar
    df = pd.concat([df_sedenter, df_lepas, df_aktif, df_tidur, df_aktif_2, df_lepas_2, df_sedenter_2, df_tidur_2], ignore_index=True)
    print(f"Total data terkumpul: {len(df)} baris!")

except FileNotFoundError as e:
    print(f"Error: File CSV tidak ditemukan! Pastikan ke-8 file ada di folder yang sama.\nDetail: {e}")
    exit()

# 2. Persiapan Data AI
X = df[['Accel_X', 'Accel_Y', 'Accel_Z', 'LDR']]
y = df['Label']

# 3. Bagi data: 80% untuk Belajar (Training), 20% untuk Ujian (Testing)
print("2. Membagi data untuk Training dan Testing...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Inisialisasi dan Latih Model Random Forest
print(f"3. Memulai proses belajar AI dengan {len(X_train)} baris data...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Uji Kepintaran AI
print("4. Menguji seberapa akurat tebakan AI...")
y_pred = model.predict(X_test)
akurasi = accuracy_score(y_test, y_pred)

print("\n" + "="*40)
print(" 🏆 HASIL RAPOR KEPINTARAN AI (VERSI REAL) 🏆")
print("="*40)
print(f"Akurasi AI  : {akurasi * 100:.2f}%\n")
print("Detail Nilai per Kategori:")
print(classification_report(y_test, y_pred))

# 6. Simpan "Otak" AI yang sudah pintar
nama_file_model = 'model_rf_wearable.pkl'
with open(nama_file_model, 'wb') as file:
    pickle.dump(model, file)

print("\n" + "="*40)
print(f"✅ [SUKSES] Otak AI TAHAN BANTING berhasil disimpan sebagai '{nama_file_model}'!")
print("="*40)