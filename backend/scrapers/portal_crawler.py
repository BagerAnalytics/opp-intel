import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import time
from database import SessionLocal
import models
from datetime import datetime
import re

# Keywords that indicate a link might be an opportunity
OPP_KEYWORDS = ['grant', 'tender', 'opportunity', 'application', 'fund', 'fellowship', 'award', 'prize', 'scholarship', 'call-for', 'apply']

def is_opportunity_link(url: str, text: str) -> bool:
    """Checks if a URL or its link text looks like an opportunity."""
    url_lower = url.lower()
    text_lower = text.lower()
    for kw in OPP_KEYWORDS:
        if kw in url_lower or kw in text_lower:
            return True
    return False

def scrape_saved_portals():
    print("Starting Portal Crawler to check saved portals for new opportunities...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    
    try:
        with SessionLocal() as db:
            portals = db.query(models.Portal).filter(models.Portal.status == "Active").all()
            if not portals:
                print("No saved portals found in memory.")
                return
            
            print(f"Found {len(portals)} saved portals in memory. Initiating crawl...")
            
            for portal in portals:
                print(f"Crawling portal: {portal.url} ({portal.name})")
                try:
                    print(f"Trying normal fetch for {portal.url}...")
                    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
                    
                    html_content = ""
                    try:
                        res = requests.get(portal.url, headers=headers, timeout=15)
                        if res.status_code in [403, 401, 429] or "cloudflare" in res.text.lower() or "captcha" in res.text.lower() or "access denied" in res.text.lower():
                            raise Exception("Bot protection detected")
                        res.raise_for_status()
                        html_content = res.text
                        print("Successfully fetched via normal requests (0 credits used).")
                    except Exception as e:
                        print(f"Normal fetch failed ({e}). Falling back to ScraperAPI...")
                        API_KEY = "7b28cf7f504c52e899376a3897d2cbc7"
                        scraper_url = f"http://api.scraperapi.com?api_key={API_KEY}&url={portal.url}&render=true"
                        
                        res = requests.get(scraper_url, timeout=45)
                        res.raise_for_status()
                        html_content = res.text
                        print("Successfully fetched via ScraperAPI.")
                        
                    if html_content:
                        soup = BeautifulSoup(html_content, 'html.parser')
                        anchors = soup.find_all('a', href=True)
                        
                        found_links = 0
                        for a in anchors:
                            href = a['href']
                            text = a.get_text(strip=True)
                            
                            # Resolve relative URLs
                            full_url = urljoin(portal.url, href)
                            
                            # Make sure it belongs to the same domain (or is a valid outbound link)
                            # Actually, many portals link OUT to the actual grant.
                            # So we will accept any valid URL if it matches keywords.
                            if full_url.startswith('http'):
                                # Skip obvious junk
                                if any(junk in full_url.lower() for junk in ['#', 'login', 'register', 'contact', 'about', 'tag', 'category', '.pdf', '.jpg']):
                                    continue
                                
                                if is_opportunity_link(full_url, text):
                                    # Check if already in DB
                                    existing = db.query(models.Opportunity).filter(models.Opportunity.link == full_url).first()
                                    if not existing:
                                        print(f"Discovered new potential opportunity via {portal.url}: {full_url}")
                                        new_opp = models.Opportunity(
                                            name=text if text else "Discovered Opportunity",
                                            link=full_url,
                                            status="queued",
                                            source=f"Portal Crawler: {portal.name}",
                                            target_entity="Pending Analysis",
                                            match_score=0
                                        )
                                        db.add(new_opp)
                                        found_links += 1
                                        portal.opportunities_found += 1
                        
                        portal.last_scraped = datetime.now().strftime("%Y-%m-%d %H:%M")
                        db.commit()
                        print(f"Finished crawling {portal.url}. Found {found_links} new links.")
                    else:
                        print(f"Warning: Failed to crawl {portal.url} (Status {res.status_code})")
                except Exception as e:
                    print(f"Warning: Failed to crawl portal {portal.url}: {e}")
                
                time.sleep(2) # Be nice to the portals
    except Exception as e:
        print(f"Critical error in Portal Crawler: {e}")

if __name__ == "__main__":
    scrape_saved_portals()
