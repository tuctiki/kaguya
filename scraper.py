import asyncio
import re
import os
import requests
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

class ProfileScraper:
    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        ]

    async def scrape_profile(self, url):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=self.user_agents[0],
                viewport={'width': 1280, 'height': 800}
            )
            page = await context.new_page()
            
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                
                # Handle Age Verification / Splash Page
                # Look for "ENTER" or "Yes" buttons
                enter_button = await page.query_selector('a:has-text("ENTER"), button:has-text("ENTER"), .enter-btn')
                if enter_button:
                    print("Bypassing age verification...")
                    await enter_button.click()
                    await page.wait_for_load_state("domcontentloaded")
                
                await asyncio.sleep(2) 
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                data = self._parse_profile(soup, url)
                return data
            except Exception as e:
                print(f"Error scraping {url}: {e}")
                return None
            finally:
                await browser.close()

    def _parse_profile(self, soup, url):
        # Precise selectors/parsing from browser inspection
        # Many profiles use tables (.profile_table or .profile.pc table)
        # Some use lists (.shopdata_feature) for store info
        
        data = {
            'Profile_URL': url,
            'Snapshot_Date': None,
            'Girl_Name': self._find_data_by_label(soup, 'Name'),
            'Age': self._parse_age_text(self._find_data_by_label(soup, 'Ages')),
            'Height_cm': self._parse_height_text(self._find_data_by_label(soup, '3 sizes')),
            'Measurements': self._find_data_by_label(soup, '3 sizes'),
            'Cup_Size': self._extract_cup_text(self._find_data_by_label(soup, '3 sizes')),
            'Weight_kg': self._parse_weight_text(self._find_data_by_label(soup, 'Weight')),
            'Shop_Name': self._find_data_by_label(soup, 'Shop name'),
            'Service_Type': "delivery health",
            'Area': self._find_data_by_label(soup, 'Area'),
            'Price_From_Yen': self._parse_price_element(soup),
            'Face_Photo_Quality': self._evaluate_photo_quality(soup),
            'Main_Face_Photo_URL': self._get_main_photo(soup),
            'Availability_Notes': self._get_availability(soup),
            'Review_Count': self._parse_reviews(soup),
            'Personal_Notes': ""
        }
        
        # Fallback for Name if still None
        if not data['Girl_Name']:
            h1 = soup.select_one('h1')
            if h1: data['Girl_Name'] = h1.get_text(strip=True)

        return data

    def _find_data_by_label(self, soup, label):
        """
        Generic search for data associated with a label.
        Works for <th>Label</th><td>Data</td> OR <p class="item_title">Label</p><p class="item_answer">Data</p>
        """
        # 1. Check Tables (th/td)
        for tr in soup.select('tr'):
            th = tr.select_one('th')
            td = tr.select_one('td')
            if th and label.lower() in th.get_text(strip=True).lower():
                return td.get_text(strip=True) if td else None
        
        # 2. Check Definition Lists (dt/dd)
        for dl in soup.select('dl'):
            for dt, dd in zip(dl.select('dt'), dl.select('dd')):
                if label.lower() in dt.get_text(strip=True).lower():
                    return dd.get_text(strip=True)

        # 3. Check Custom Lists (like .shopdata_feature)
        for item in soup.select('.shopdata_item, .info-item'):
            title = item.select_one('.item_title, .label')
            answer = item.select_one('.item_answer, .value')
            if title and answer and label.lower() in title.get_text(strip=True).lower():
                return answer.get_text(strip=True)

        return None

    def _parse_age_text(self, text):
        if not text: return None
        # Handle "22Age" or just "22"
        match = re.search(r'(\d+)', text)
        return int(match.group(1)) if match else None

    def _parse_height_text(self, text):
        if not text: return None
        # Handle "T158 89(F)・55・84"
        match = re.search(r'T(\d+)', text)
        return int(match.group(1)) if match else None

    def _extract_cup_text(self, text):
        if not text: return None
        # Handle "T158 89(F)・55・84"
        match = re.search(r'\(([A-Z])\)', text)
        return match.group(1) if match else None

    def _parse_weight_text(self, text):
        if not text: return "N/A"
        match = re.search(r'(\d+)kg', text)
        return match.group(1) if match else "N/A"

    def _parse_price_element(self, soup):
        # Multiple possible price selectors
        selectors = ['.profile_price_num', '.girl-price', '.price_num', '.price']
        for sel in selectors:
            price_el = soup.select_one(sel)
            if price_el:
                text = price_el.get_text(strip=True)
                match = re.search(r'([\d,]+)', text)
                if match:
                    return int(match.group(1).replace(',', ''))
        
        # Last resort: search for currency symbol YEN
        text = soup.get_text()
        match = re.search(r'¥\s*([\d,]+)', text)
        if match:
            return int(match.group(1).replace(',', ''))
        return None

    def _evaluate_photo_quality(self, soup):
        gallery_selectors = ['.girl_photo_list img', '.photo-gallery img', '.gallery img']
        count = 0
        for sel in gallery_selectors:
            count = max(count, len(soup.select(sel)))
        
        if count >= 4: return "High"
        if count >= 2: return "Medium"
        return "Low"

    def _get_main_photo(self, soup):
        selectors = ['.gallery_top img.girlsimg_top.select', '.main_visual img', '.girl-main-visual img', '.main-photo img']
        for sel in selectors:
            img = soup.select_one(sel)
            if img and img.has_attr('src'):
                return img['src']
        return None

    def _get_availability(self, soup):
        selectors = ['.schedule_table', '.calendar-box', '.schedule-box']
        for sel in selectors:
            schedule = soup.select_one(sel)
            if schedule:
                text = schedule.get_text(separator=' ', strip=True)
                return re.sub(r'\s+', ' ', text)
        return "N/A"

    def _parse_reviews(self, soup):
        # Check badges or text like Reviews(12)
        text = soup.get_text()
        match = re.search(r'Reviews?\((\d+)\)', text)
        if match: return int(match.group(1))
        
        selectors = ['.review_count', '.review_list_title', '.review-total']
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                match = re.search(r'(\d+)', el.get_text())
                if match: return int(match.group(1))
        return 0

    def download_image(self, url, girl_id, base_dir='images'):
        if not url: return None
        if not os.path.exists(base_dir):
            os.makedirs(base_dir)
            
        # Extract extension or default to .jpg
        ext = '.jpg'
        if '.png' in url: ext = '.png'
        
        filename = f"{girl_id}{ext}"
        filepath = os.path.join(base_dir, filename)
        
        # Only download if not exists
        if os.path.exists(filepath):
            return filepath
            
        try:
            print(f"Downloading image: {url}")
            response = requests.get(url, headers={'User-Agent': self.user_agents[0]}, timeout=10)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                return filepath
        except Exception as e:
            print(f"Error downloading image {url}: {e}")
        return None


