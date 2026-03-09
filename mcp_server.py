from mcp.server.fastmcp import FastMCP
from database import init_db, GirlProfile, Snapshot
import subprocess
import os
from typing import Optional, List, Dict, Any

# Initialize FastMCP server
mcp = FastMCP("kaguya")

# Setup Database session maker
# Using absolute path so it works when executed by OpenClaw from any directory
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kaguya.db')
SessionLocal = init_db(f'sqlite:///{DB_PATH}')
@mcp.tool()
def get_profiles(limit: int = 10, area: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get a list of scraped profiles from the kaguya database.
    Optionally filter by area code (e.g., A1311).
    """
    db = SessionLocal()
    try:
        query = db.query(GirlProfile)
        if area:
            # Filter based on the area field in the Snapshot table
            query = query.join(Snapshot).filter(Snapshot.area == area).distinct()
        
        profiles = query.limit(limit).all()
        result = []
        for p in profiles:
            result.append({
                "profile_url": p.profile_url,
                "name": p.name,
                "shop_name": p.shop_name,
                "service_type": p.service_type,
                "cup_size": p.cup_size,
                "measurements": p.measurements,
                "height_cm": p.height_cm,
                "weight_kg": p.weight_kg,
                "local_image_path": p.local_image_path,
            })
        return result
    finally:
        db.close()

@mcp.tool()
def get_profile_by_url(url: str) -> Dict[str, Any]:
    """
    Get detailed profile data and snapshot history for a specific profile URL.
    """
    db = SessionLocal()
    try:
        profile = db.query(GirlProfile).filter_by(profile_url=url).first()
        if not profile:
            return {"error": f"Profile not found for url: {url}"}
            
        history = db.query(Snapshot).filter_by(profile_url=url).order_by(Snapshot.snapshot_date.desc()).all()
        
        return {
            "profile": {
                "profile_url": profile.profile_url,
                "name": profile.name,
                "shop_name": profile.shop_name,
                "service_type": profile.service_type,
                "cup_size": profile.cup_size,
                "measurements": profile.measurements,
                "height_cm": profile.height_cm,
                "weight_kg": profile.weight_kg,
                "local_image_path": profile.local_image_path,
            },
            "history": [{
                "date": str(h.snapshot_date),
                "age": h.age,
                "price_yen": h.price_yen,
                "area": h.area,
                "availability": h.availability,
                "review_count": h.review_count,
                "change_notes": h.change_notes
            } for h in history]
        }
    finally:
        db.close()

@mcp.tool()
def trigger_discovery(pages: int = 5, area: Optional[str] = None) -> str:
    """
    Run kaguya in 'full' mode as a background process to find new profiles.
    Returns a status message indicating the background job started.
    """
    cmd = ["python3", "kaguya.py", "--mode", "full", "--pages", str(pages)]
    if area:
        cmd.extend(["--area", area])
        
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return f"Started background discovery: {pages} pages, area: {area if area else 'All'}"

@mcp.tool()
def trigger_update() -> str:
    """
    Run kaguya in 'update' mode as a background process to refresh existing profiles.
    Returns a status message indicating the background job started.
    """
    cmd = ["python3", "kaguya.py", "--mode", "update"]
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return "Started background update of existing profiles."

if __name__ == "__main__":
    mcp.run(transport="stdio")
