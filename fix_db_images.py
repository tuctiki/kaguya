import os
from database import GirlProfile, init_db

def restore_image_paths():
    Session = init_db('sqlite:///kaguya.db')
    session = Session()
    count = 0
    
    image_files = os.listdir('images')
    for filename in image_files:
        if filename.endswith('.jpg') or filename.endswith('.png'):
            girl_id = filename.split('.')[0]
            # Find profile that contains the girl_id in the URL
            profile = session.query(GirlProfile).filter(GirlProfile.profile_url.like(f'%{girl_id}%')).first()
            if profile:
                profile.local_image_path = f"images/{filename}"
                count += 1
    
    session.commit()
    print(f"Updated {count} profiles with local image paths.")
    session.close()

if __name__ == "__main__":
    restore_image_paths()
