import os
import sys
import json
import subprocess
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal

def scrape_terraviva():
    print("Starting Terra Viva Grants Scraper (Agriculture/Environment)...")
    base_url = "https://terravivagrants.org/"
    
    extracted_urls = []
    
    try:
        import requests
        from bs4 import BeautifulSoup
        
        API_KEY = "54c796e10be2f82a70de0e92f1806e89"
        scraper_url = f"http://api.scraperapi.com?api_key={API_KEY}&url={base_url}&render=true"
        
        res = requests.get(scraper_url, timeout=60)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Look for h3 a, .read-more-button, .entry-title a
        anchors = soup.select("h3 a, .read-more-button, .entry-title a")
        for a in anchors:
            link = a.get('href')
            if link and 'terravivagrants.org' in link:
                if "/category/" not in link and "/about/" not in link and "/contact/" not in link:
                    if link not in extracted_urls:
                        extracted_urls.append(link)
    except Exception as e:
        print(f"Error scraping Terra Viva: {e}")
        return

    print(f"Terra Viva Scraper found {len(extracted_urls)} recent grant URLs.")
    
    # Check against database
    new_urls = []
    try:
        with SessionLocal() as db:
            for url in extracted_urls:
                existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
                if not existing:
                    new_urls.append(url)
    except Exception as e:
        print(f"Database error in Terra Viva scraper: {e}")
        return
        
    print(f"After filtering known links, {len(new_urls)} NEW Terra Viva grants remain.")
    
    if new_urls:
        try:
            tasks = []
            with SessionLocal() as db:
                for url in new_urls:
                    new_opp = models.Opportunity(
                        name=f"Extracting Terra Viva Grant...",
                        funder="Scanning...",
                        value="Scanning...",
                        closing_date="Scanning...",
                        description="Agriculture/Environment Grant Discovered...",
                        benefits="",
                        eligibility_criteria="",
                        selection_criteria="",
                        application_process="",
                        past_winners="",
                        link=url,
                        source="Terra Viva Grants",
                        status="Scanning...",
                        match_score=0,
                        match_reasoning="",
                        strategy=""
                    )
                    db.add(new_opp)
                    db.flush()
                    tasks.append({"id": new_opp.id, "url": url})
                db.commit()
            
            payload = json.dumps(tasks)
            subprocess.Popen(
                [sys.executable, "scrapers/bulk_scraper.py", payload],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print(f"Successfully queued {len(tasks)} Terra Viva grants for extraction.")
        except Exception as e:
            print(f"Failed to queue Terra Viva scraper: {e}")
    else:
        print("No new Terra Viva opportunities this run.")

if __name__ == "__main__":
    scrape_terraviva()
