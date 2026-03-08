from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()

class GirlProfile(Base):
    __tablename__ = 'girl_profiles'
    
    profile_url = Column(String, primary_key=True)
    name = Column(String)
    height_cm = Column(Integer)
    cup_size = Column(String)
    measurements = Column(String)
    weight_kg = Column(String)
    shop_name = Column(String)
    service_type = Column(String)
    local_image_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    snapshots = relationship("Snapshot", back_populates="profile", cascade="all, delete-orphan")

class Snapshot(Base):
    __tablename__ = 'snapshots'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_url = Column(String, ForeignKey('girl_profiles.profile_url'))
    snapshot_date = Column(DateTime, default=datetime.utcnow)
    age = Column(Integer)
    price_yen = Column(Integer)
    area = Column(String)
    availability = Column(String)
    review_count = Column(Integer)
    change_notes = Column(String)
    face_photo_quality = Column(String)
    personal_notes = Column(String)
    
    profile = relationship("GirlProfile", back_populates="snapshots")

def init_db(db_url='sqlite:///kaguya.db'):
    engine = create_engine(db_url)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
