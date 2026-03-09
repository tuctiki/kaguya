import asyncio
import argparse
import random
import time
import re
import os
from datetime import datetime
from discovery import DiscoveryModule
from scraper import ProfileScraper
from database import init_db, GirlProfile, Snapshot

class KaguyaEngine:
    def __init__(self, db_url='sqlite:///kaguya.db'):
        self.discovery = DiscoveryModule()
        self.scraper = ProfileScraper()
        Session = init_db(db_url)
        self.session = Session()

    def _get_girl_id(self, url):
        match = re.search(r'girlid-(\d+)', url)
        return match.group(1) if match else "unknown"

    async def run_full(self, max_pages=5, area=None):
        print(f"[{datetime.now()}] Starting Full Run (Area: {area if area else 'All'})...")
        urls = await self.discovery.discover_profiles(max_pages=max_pages, area=area)
        await self._process_urls(urls)

    async def run_update(self):
        print(f"[{datetime.now()}] Starting Update Run...")
        profiles = self.session.query(GirlProfile).all()
        if not profiles:
            print("No existing data found. Please run a Full Run first.")
            return
        
        urls = [p.profile_url for p in profiles]
        await self._process_urls(urls)

    async def run_image_recovery(self):
        print(f"[{datetime.now()}] Starting Image Recovery Run...")
        profiles = self.session.query(GirlProfile).filter(GirlProfile.local_image_path == None).all()
        if not profiles:
            print("No profiles found with missing images.")
            return
        
        print(f"Found {len(profiles)} profiles with missing images.")
        urls = [p.profile_url for p in profiles]
        await self._process_urls(urls)

    async def _process_urls(self, urls):
        print(f"Processing {len(urls)} profiles...")
        
        # Batching logic
        batch_size = 20
        for i in range(0, len(urls), batch_size):
            batch = urls[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1} ({len(batch)} urls)...")
            
            for url in batch:
                data = await self.scraper.scrape_profile(url)
                if data:
                    self._save_girl_data(data)
                
                # Anti-scraping: Random delay between requests
                delay = random.uniform(10, 20)
                print(f"Waiting {delay:.2f}s before next request...")
                await asyncio.sleep(delay)
            
            # Anti-scraping: Longer break between batches
            if i + batch_size < len(urls):
                batch_break = random.uniform(300, 600) # 5-10 minutes
                print(f"Batch complete. Taking a long break: {batch_break/60:.2f} minutes...")
                await asyncio.sleep(batch_break)

    def _save_girl_data(self, data):
        url = data['Profile_URL']
        girl_id = self._get_girl_id(url)
        
        # 1. Download image
        image_url = data.get('Main_Face_Photo_URL')
        local_image_path = self.scraper.download_image(image_url, girl_id)
        
        # 2. Update/Create Profile
        profile = self.session.query(GirlProfile).filter_by(profile_url=url).first()
        if not profile:
            profile = GirlProfile(
                profile_url=url,
                name=data['Girl_Name'],
                height_cm=data['Height_cm'],
                cup_size=data['Cup_Size'],
                measurements=data.get('Measurements'),
                weight_kg=data.get('Weight_kg'),
                shop_name=data.get('Shop_Name'),
                service_type=data.get('Service_Type'),
                local_image_path=local_image_path
            )
            self.session.add(profile)
        else:
            # Update dynamic fields
            profile.name = data['Girl_Name']
            profile.cup_size = data['Cup_Size']
            profile.measurements = data.get('Measurements')
            profile.weight_kg = data.get('Weight_kg')
            profile.shop_name = data.get('Shop_Name')
            profile.service_type = data.get('Service_Type')
            if local_image_path:
                profile.local_image_path = local_image_path

        # 3. Detect changes from latest snapshot
        latest_snapshot = self.session.query(Snapshot).filter_by(profile_url=url).order_by(Snapshot.snapshot_date.desc()).first()
        change_notes = self._get_change_notes(latest_snapshot, data) if latest_snapshot else "New Girl"

        # 4. Create Snapshot
        snapshot = Snapshot(
            profile_url=url,
            age=data['Age'],
            price_yen=data['Price_From_Yen'],
            area=data['Area'],
            availability=data['Availability_Notes'],
            review_count=data['Review_Count'],
            face_photo_quality=data['Face_Photo_Quality'],
            change_notes=change_notes,
            personal_notes=data.get('Personal_Notes')
        )
        self.session.add(snapshot)
        self.session.commit()
        print(f"Saved: {data['Girl_Name']} (ID: {girl_id}) - Changes: {change_notes}")

    def _get_change_notes(self, last_snap, data_new):
        changes = []
        tracked = [
            ('price_yen', 'Price', 'Price_From_Yen'),
            ('availability', 'Availability', 'Availability_Notes'),
            ('review_count', 'Reviews', 'Review_Count')
        ]
        
        for db_field, label, data_field in tracked:
            old_val = getattr(last_snap, db_field)
            new_val = data_new.get(data_field)
            if str(old_val) != str(new_val):
                changes.append(f"{label}: {old_val} -> {new_val}")
        
        return "; ".join(changes) if changes else ""

def main():
    parser = argparse.ArgumentParser(description="kaguya: Tokyo Delivery Health Data Collector")
    parser.add_argument("--mode", choices=["full", "update", "update-images"], default="full", help="Run mode")
    parser.add_argument("--pages", type=int, default=5, help="Number of pages to discover (full mode only)")
    parser.add_argument("--area", help="Specific area code (e.g., A1311 or A1304/A130401)")
    parser.add_argument("--db", default="sqlite:///kaguya.db", help="Database URL")
    
    args = parser.parse_args()
    
    engine = KaguyaEngine(args.db)
    
    if args.mode == "full":
        asyncio.run(engine.run_full(max_pages=args.pages, area=args.area))
    elif args.mode == "update":
        asyncio.run(engine.run_update())
    elif args.mode == "update-images":
        asyncio.run(engine.run_image_recovery())

if __name__ == "__main__":
    main()
