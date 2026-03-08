from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import init_db, GirlProfile, Snapshot
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import os

app = FastAPI(title="kaguya API")

# Setup Database
SessionLocal = init_db()

from datetime import datetime

# Pydantic Models for API
class SnapshotBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    snapshot_date: datetime
    age: Optional[int]
    price_yen: Optional[int]
    area: Optional[str]
    availability: Optional[str]
    review_count: Optional[int]
    change_notes: Optional[str]
    face_photo_quality: Optional[str]
    personal_notes: Optional[str]

class ProfileBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    profile_url: str
    name: str
    height_cm: Optional[int]
    cup_size: Optional[str]
    measurements: Optional[str]
    weight_kg: Optional[str]
    shop_name: Optional[str]
    service_type: Optional[str]
    local_image_path: Optional[str]

class ProfileWithLatest(ProfileBase):
    latest_snapshot: Optional[SnapshotBase] = None

# Endpoints
@app.get("/api/profiles", response_model=List[ProfileWithLatest])
def get_profiles():
    db = SessionLocal()
    try:
        profiles = db.query(GirlProfile).all()
        result = []
        for p in profiles:
            latest = db.query(Snapshot).filter_by(profile_url=p.profile_url).order_by(Snapshot.snapshot_date.desc()).first()
            # Use model_validate instead of from_orm for Pydantic V2
            p_data = ProfileWithLatest.model_validate(p)
            if latest:
                l_data = SnapshotBase.model_validate(latest)
                p_data.latest_snapshot = l_data
            result.append(p_data)
        return result
    finally:
        db.close()

@app.get("/api/profiles/{profile_id:path}/history", response_model=List[SnapshotBase])
def get_history(profile_id: str):
    db = SessionLocal()
    try:
        history = db.query(Snapshot).filter_by(profile_url=profile_id).order_by(Snapshot.snapshot_date.desc()).all()
        result = []
        for h in history:
            h_data = SnapshotBase.model_validate(h)
            result.append(h_data)
        return result
    finally:
        db.close()

# Serve static images
if os.path.exists("images"):
    app.mount("/images", StaticFiles(directory="images"), name="images")

# Serve Frontend (Static Export)
@app.get("/{rest_of_path:path}")
async def serve_frontend(rest_of_path: str):
    frontend_dir = "frontend/out"
    if not os.path.exists(frontend_dir):
        return {"message": "Frontend not built yet. Run 'npm run build' in the frontend directory."}
    
    # Try serving the specific path
    file_path = os.path.join(frontend_dir, rest_of_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html (for SPA routing)
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="Not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
