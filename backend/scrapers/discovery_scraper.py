import os
import sys
import json
import time
import subprocess
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal

KEYWORDS = [
    "agriculture grants south africa",
    "tech startup funding africa",
    "business tenders south africa"
]

# Domains we already scrape or want to explicitly ignore
IGNORE_DOMAINS = [
    "etenders.gov.za",
    "opportunitydesk.org",
    "linkedin.com",
    "youtube.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "tiktok.com"
]

def is_valid_url(url):
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Must be http/https
        if parsed.scheme not in ["http", "https"]:
            return False
            
        # Ignore known domains
        for ignore in IGNORE_DOMAINS:
            if ignore in domain:
                return False
                
        # Ignore common document files directly, the generic scraper handles HTML better
        if parsed.path.lower().endswith(('.pdf', '.doc', '.docx', '.xls', '.xlsx')):
            return False
            
        return True
    except:
        return False

def scrape_discovery_engine():
    print("Starting Discovery Engine using Serper API...")
    
    discovered_urls = []
    SERPER_API_KEY = "26da271301eebe35eeac7ef637452e67bd0a04ac"
    
    try:
        import requests
        headers = {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        
        for keyword in KEYWORDS:
            print(f"Searching for: '{keyword}'")
            
            try:
                payload = {"q": keyword, "num": 10}
                response = requests.post("https://google.serper.dev/search", headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    organic_results = data.get("organic", [])
                    for r in organic_results:
                        link = r.get("link")
                        if link and link not in discovered_urls and is_valid_url(link):
                            discovered_urls.append(link)
                else:
                    print(f"Warning: Serper API error {response.status_code}: {response.text}")
            except Exception as e:
                print(f"Warning: Failed to search '{keyword}': {e}")
            
            time.sleep(1) # Be nice
                
    except Exception as e:
        print(f"Critical error in Discovery Engine: {e}")
        return
        
    print(f"Discovery Engine found {len(discovered_urls)} valid URLs across all keywords.")
    
    # Check against database
    new_urls = []
    try:
        with SessionLocal() as db:
            for url in discovered_urls:
                existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
                if not existing:
                    new_urls.append(url)
    except Exception as e:
        print(f"Database error during discovery: {e}")
        return
        
    print(f"After filtering known database links, {len(new_urls)} NEW URLs remain.")
    
    # Send new URLs to the bulk scraper
    if new_urls:
        print("Passing new URLs to the Generic Scraper pipeline...")
        # To avoid blocking or recursively opening playwright in the same thread,
        # we call the bulk scraper script natively.
        try:
            # We must create mock placeholder DB entries so bulk scraper can process them
            tasks = []
            with SessionLocal() as db:
                for url in new_urls:
                    new_opp = models.Opportunity(
                        name=f"Extracting from {url[:30]}...",
                        funder="Scanning...",
                        value="Scanning...",
                        closing_date="Scanning...",
                        description="Discovered via AI Engine...",
                        benefits="",
                        eligibility_criteria="",
                        selection_criteria="",
                        application_process="",
                        past_winners="",
                        link=url,
                        source="Discovery Engine",
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
            print(f"Successfully queued {len(tasks)} discovered links for background extraction.")
        except Exception as e:
            print(f"Failed to queue bulk scraper: {e}")
    else:
        print("No new opportunities discovered this run.")

if __name__ == "__main__":
    scrape_discovery_engine()
