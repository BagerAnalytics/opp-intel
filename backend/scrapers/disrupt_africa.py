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

def scrape_disrupt_africa():
    print("Starting Disrupt Africa Scraper (Tech/Startup Funding)...")
    base_url = "https://disrupt-africa.com/category/funding/"
    
    extracted_urls = []
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            Stealth().apply_stealth_sync(page)
            
            # Navigate to latest funding news
            page.goto(base_url, timeout=60000)
            
            # Extract URLs from article titles
            links = page.evaluate('''() => {
                const anchors = Array.from(document.querySelectorAll('h3.entry-title a, h2.entry-title a'));
                return [...new Set(anchors.map(a => a.href).filter(href => href && href.includes('disrupt-africa.com')))];
            }''')
            
            for link in links:
                if link and "/category/" not in link and "/about/" not in link:
                    extracted_urls.append(link)
            
            browser.close()
    except Exception as e:
        print(f"Error scraping Disrupt Africa: {e}")
        return

    print(f"Disrupt Africa Scraper found {len(extracted_urls)} recent tech funding URLs.")
    
    # Check against database
    new_urls = []
    try:
        with SessionLocal() as db:
            for url in extracted_urls:
                existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
                if not existing:
                    new_urls.append(url)
    except Exception as e:
        print(f"Database error in Disrupt Africa scraper: {e}")
        return
        
    print(f"After filtering known links, {len(new_urls)} NEW Disrupt Africa funding opportunities remain.")
    
    if new_urls:
        try:
            tasks = []
            with SessionLocal() as db:
                for url in new_urls:
                    new_opp = models.Opportunity(
                        name=f"Extracting African Tech Funding...",
                        funder="Scanning...",
                        value="Scanning...",
                        closing_date="Scanning...",
                        description="Startup funding / accelerator news discovered...",
                        benefits="",
                        eligibility_criteria="",
                        selection_criteria="",
                        application_process="",
                        past_winners="",
                        link=url,
                        source="Disrupt Africa",
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
            print(f"Successfully queued {len(tasks)} Disrupt Africa opportunities for extraction.")
        except Exception as e:
            print(f"Failed to queue Disrupt Africa scraper: {e}")
    else:
        print("No new Disrupt Africa opportunities this run.")

if __name__ == "__main__":
    scrape_disrupt_africa()
