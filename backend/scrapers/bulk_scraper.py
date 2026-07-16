import os
import sys
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal
from scrapers.generic_scraper import extract_from_url

def run_bulk_scraper(tasks):
    total = len(tasks)
    print(f"Starting bulk import for {total} items...")
    
    for idx, task in enumerate(tasks):
        opp_id = task.get("id")
        url = task.get("url")
        print(f"\n--- Extracting ID {opp_id}: {url} ---")
        
        try:
            with SessionLocal() as db:
                # Check if it was deleted while in queue
                opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
                if not opp:
                    print(f"Opportunity ID {opp_id} deleted. Skipping.")
                    continue
                
                # Update progress bar
                progress = db.query(models.ScraperProgress).filter(models.ScraperProgress.id == 1).first()
                if progress:
                    progress.current_task = f"AI Extractor: Processing {idx+1}/{total} links..."
                    # Scale progress between 98% and 99%
                    progress.progress_percent = 98
                    from datetime import datetime
                    progress.updated_at = datetime.utcnow().isoformat()
                db.commit()
            
            # This handles playwright, fallback, LLM, saving to DB, and scoring
            result = extract_from_url(url, opp_id=opp_id)
            if "error" in result:
                print(f"Error extracting {url}: {result['error']}")
                with SessionLocal() as db:
                    opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
                    if opp:
                        opp.name = f"Extraction Failed: {url}"
                        opp.status = "failed"
                        db.commit()
            else:
                print(f"Successfully processed {url}")
                
        except Exception as e:
            print(f"Unhandled exception on {url}: {e}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python bulk_scraper.py '[{\"id\": 1, \"url\": \"...\"}]'")
        return
        
    try:
        tasks = json.loads(sys.argv[1])
    except Exception as e:
        print("Failed to parse JSON tasks:", e)
        return
        
    run_bulk_scraper(tasks)

if __name__ == "__main__":
    main()
