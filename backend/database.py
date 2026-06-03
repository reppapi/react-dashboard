from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Menentukan nama file database SQLite lokal
SQLALCHEMY_DATABASE_URL = "sqlite:///./sensor_data.db"

engine = create_engine(
    # 'check_same_thread=False' wajib untuk SQLite di FastAPI
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. TABEL 1: Status Real-time Saat Ini
class CurrentStatus(Base):
    __tablename__ = "current_status"
    
    id = Column(Integer, primary_key=True, index=True) # Selalu ID = 1
    last_update = Column(String)                       # Waktu masuk
    activity_prediction = Column(String)               # Awake / Sleep
    ldr_value = Column(Integer)                        # Intensitas Cahaya
    sedentary_minutes = Column(Integer)                # Akumulasi duduk
    battery = Column(Integer, default=100)             # Baterai Device (%)
    optimization_mode = Column(Integer, default=1)     # 0: Off, 1: On
    buzzer_active = Column(Integer, default=0)         # 0: Off, 1: On

# 3. TABEL 2: Histori Log untuk Grafik Frontend
class ActivityHistory(Base):
    __tablename__ = "activity_history"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String)
    prediction = Column(String)
    ldr_value = Column(Integer)
    ax_std = Column(Float)                             # Fitur dari ML

# Membuat file .db dan tabel secara otomatis saat program dijalankan
def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed initial row for CurrentStatus if empty
    session = SessionLocal()
    try:
        status = session.query(CurrentStatus).filter_by(id=1).first()
        if not status:
            from datetime import datetime
            status = CurrentStatus(
                id=1,
                last_update=datetime.now().strftime("%I:%M %p"),
                activity_prediction="Awake",
                ldr_value=200,
                sedentary_minutes=0,
                battery=100,
                optimization_mode=1,
                buzzer_active=0
            )
            session.add(status)
            session.commit()
    except Exception as e:
        session.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        session.close()