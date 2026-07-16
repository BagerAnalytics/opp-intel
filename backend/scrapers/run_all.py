import os
import sys
from datetime import datetime

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
        update_progress(db, 10, "Hunting for new Opportunity Portals...")
        scrape_meta_portals()
        
        update_progress(db, 15, "Crawling saved Portals in memory...")
        scrape_saved_portals()
        
        update_progress(db, 25, "Scraping Discovery Engine...")
        scrape_discovery_engine()
        
        update_progress(db, 40, "Scraping TerraViva Grants...")
        scrape_terraviva()
        
        update_progress(db, 55, "Scraping Disrupt Africa...")
        scrape_disrupt_africa()
        
        update_progress(db, 70, "Scraping Opportunity Desk...")
        scrape_opportunity_desk()
        
        update_progress(db, 85, "Scraping eTenders SA...")
        scrape_etenders()
        
        update_progress(db, 95, "Scraping LinkedIn Opportunities...")
        scrape_linkedin()
        
        # Process all queued URLs that were found during this run
        update_progress(db, 98, "Processing AI Extractor queue...")
        scanning_opps = db.query(models.Opportunity).filter(models.Opportunity.status == "Scanning...").all()
        if scanning_opps:
            print(f"Found {len(scanning_opps)} queued links. Handing off to AI Extractor...")
            tasks = [{"id": opp.id, "url": opp.link} for opp in scanning_opps if opp.link]
            if tasks:
                from scrapers.bulk_scraper import run_bulk_scraper
                run_bulk_scraper(tasks)
                print("AI Extractor finished processing queue.")
        
        finish_progress(db)
        print("Scrapers completed successfully.")
        
    except Exception as e:
        print(f"Scraper execution error: {e}")
        finish_progress(db)
    finally:
        db.close()

if __name__ == "__main__":
    run_all_scrapers()
