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
        
        # Process up to 100 items per run to avoid infinite hanging
        items_processed = 0
        from scrapers.bulk_scraper import run_bulk_scraper
        
        while items_processed < 100:
            queued_opps = db.query(models.Opportunity).filter(models.Opportunity.status == "queued").limit(10).all()
            stuck_opps = db.query(models.Opportunity).filter(models.Opportunity.status == "Scanning...").limit(5).all()
            
            batch = queued_opps + stuck_opps
            if not batch:
                print("Queue is empty.")
                break
                
            print(f"Pulled {len(batch)} links from queue. Sending to AI Extractor...")
            tasks = []
            for opp in batch:
                if opp.link:
                    opp.status = "Scanning..."
                    tasks.append({"id": opp.id, "url": opp.link})
            db.commit()
            
            if tasks:
                # Update progress based on how many we've done (50% to 95%)
                progress_val = 50 + int((items_processed / 100.0) * 45)
                update_progress(db, progress_val, f"AI Extractor: Processing {items_processed}/100 max...")
                run_bulk_scraper(tasks)
                items_processed += len(tasks)
        
        print(f"AI Extractor finished processing {items_processed} items.")
        
        finish_progress(db)
        print("Scrapers completed successfully.")
        
    except Exception as e:
        print(f"Scraper execution error: {e}")
        finish_progress(db)
    finally:
        db.close()

if __name__ == "__main__":
    run_all_scrapers()
