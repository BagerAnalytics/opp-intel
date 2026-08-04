import os
import sys
from datetime import datetime
import requests
import urllib.parse
from urllib.parse import urlparse, parse_qs

# --- MONKEY PATCH TO SAVE SCRAPER API CREDITS ---
original_get = requests.get

def smart_get(url, *args, **kwargs):
    if url.startswith('http://api.scraperapi.com'):
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        original_target = params.get('url', [None])[0]
        
        if original_target:
            print(f'[Credit Saver] Intercepted request to {original_target}')
            try:
                # Direct Fetch first
                headers = kwargs.get('headers', {})
                if 'User-Agent' not in headers:
                    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                kwargs['headers'] = headers
                
                # We need to temporarily swap the timeout
                old_timeout = kwargs.get('timeout', 60)
                kwargs['timeout'] = 15
                
                res = original_get(original_target, *args, **kwargs)
                kwargs['timeout'] = old_timeout # Restore
                
                if res.status_code == 200 or res.status_code == 404:
                    print('[Credit Saver] Direct fetch successful! Saved 1 API credit.')
                    return res
                else:
                    print(f'[Credit Saver] Direct fetch got {res.status_code}. Falling back to ScraperAPI proxy...')
            except requests.RequestException as e:
                kwargs['timeout'] = old_timeout # Restore
                print(f'[Credit Saver] Direct fetch failed. Falling back to ScraperAPI proxy...')
                
            # Fallback
            return original_get(url, *args, **kwargs)
            
    return original_get(url, *args, **kwargs)

requests.get = smart_get
# ------------------------------------------------

# Add parent directory to path so we can import database, models, and services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.opportunity_desk import scrape_opportunity_desk
from scrapers.linkedin_opportunities import scrape_linkedin
from scrapers.etenders_sa import scrape_etenders
from scrapers.discovery_scraper import scrape_discovery_engine
from scrapers.terraviva_grants import scrape_terraviva
from scrapers.disrupt_africa import scrape_disrupt_africa
from scrapers.meta_discovery import scrape_meta_portals
from scrapers.portal_crawler import scrape_saved_portals
from database import SessionLocal
import models

def update_progress(db, percent, task_name):
    progress = db.query(models.ScraperProgress).filter(models.ScraperProgress.id == 1).first()
    if progress:
        progress.progress_percent = percent
        progress.current_task = task_name
        progress.updated_at = datetime.utcnow().isoformat()
        db.commit()
        print(f"Progress [{percent}%]: {task_name}")

def finish_progress(db):
    progress = db.query(models.ScraperProgress).filter(models.ScraperProgress.id == 1).first()
    if progress:
        progress.is_active = False
        progress.progress_percent = 100
        progress.current_task = "Idle"
        progress.updated_at = datetime.utcnow().isoformat()
        db.commit()

def run_all_scrapers():
    print("Running scheduled scrapers from isolated process...")
    db = SessionLocal()
    try:
        # TEMP BYPASS: Skip discovery to process queue instantly!
        # Discovery phases restored
        update_progress(db, 5, "Hunting for new Opportunity Portals...")
        scrape_meta_portals()
        
        update_progress(db, 10, "Scraping Disrupt Africa...")
        scrape_disrupt_africa()
        
        update_progress(db, 15, "Scraping TerraViva Grants...")
        scrape_terraviva()
        
        update_progress(db, 20, "Scraping Discovery Engine...")
        scrape_discovery_engine()
        
        update_progress(db, 25, "Crawling Saved Portals...")
        scrape_saved_portals()
        
        update_progress(db, 35, "Scraping Opportunity Desk...")
        scrape_opportunity_desk()
        
        update_progress(db, 40, "Scraping eTenders SA...")
        scrape_etenders()
        
        update_progress(db, 45, "Scraping LinkedIn Opportunities...")
        scrape_linkedin()
        
        # Centralized Extraction Queue Processor
        update_progress(db, 50, "Processing AI Extractor queue...")
        

        
        finish_progress(db)
        print("Scrapers completed successfully.")
        
    except Exception as e:
        print(f"Scraper execution error: {e}")
        if str(e) == "API_QUOTA_EXCEEDED":
            update_progress(db, 0, "ERROR: Gemini AI Quota Exhausted! Please update your API Key.")
            # Set is_active to False manually instead of calling finish_progress to keep the error visible
            progress = db.query(models.ScraperProgress).filter(models.ScraperProgress.id == 1).first()
            if progress:
                progress.is_active = False
                db.commit()
        else:
            finish_progress(db)
    finally:
        db.close()

if __name__ == "__main__":
    run_all_scrapers()
