import requests
from bs4 import BeautifulSoup
import re

# Supabase Configuration
SUPABASE_URL = "https://ujwcwlkuoncaocwykuwi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqd2N3bGt1b25jYW9jd3lrdXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDY2NDUsImV4cCI6MjA5NDc4MjY0NX0.h_DXcCw4y4Uokc9ZE7-NahUOqPfuDMNj2Lv_cMG0nz4"

TARGET_URL = "https://www.jumia.com.eg/mobile-phones/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.jumia.com.eg/",
    "Connection": "keep-alive"
}

def clean_price(price_text):
    if not price_text: return 0.0
    cleaned = re.sub(r'[^\d.]', '', price_text.replace(',', ''))
    return float(cleaned) if cleaned else 0.0

def upload_to_supabase(data_list):
    if not data_list: return
    url = f"{SUPABASE_URL}/rest/v1/products"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    response = requests.post(url, headers=headers, json=data_list)
    if response.status_code in [200, 201]:
        print(f"✅ تم رفع {len(data_list)} منتج بنجاح إلى Supabase!")
    else:
        print(f"❌ خطأ في الرفع: {response.text}")

def run_scraper():
    print("🚀 جاري الاتصال بجوميا...")
    try:
        response = requests.get(TARGET_URL, headers=HEADERS, timeout=20)
        soup = BeautifulSoup(response.text, 'html.parser')
        products_list = []
        
        items = soup.find_all('article', class_='prd')
        for item in items:
            name = item.find('h3', class_='name').text.strip() if item.find('h3', class_='name') else "No Name"
            price = clean_price(item.find('div', class_='prc').text.strip()) if item.find('div', class_='prc') else 0.0
            img = item.find('img', class_='img')
            image_url = img.get('data-src') if img else ""
            
            if name != "No Name":
                products_list.append({"name": name, "price": price, "image_url": image_url, "category": "Jumia Mobiles", "status": "active"})
        
        print(f"📦 تم سحب {len(products_list)} منتج.")
        upload_to_supabase(products_list)
        
    except Exception as e:
        print(f"❌ حدث خطأ: {str(e)}")

if __name__ == "__main__":
    run_scraper()

