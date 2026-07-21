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
                
                # Database connection check
                opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
                if not opp:
                    print(f"Opportunity ID {opp_id} deleted. Skipping.")
                    continue
            
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
            if "API_QUOTA_EXCEEDED" in str(e):
                print("FATAL ERROR: API Quota Exceeded! Halting bulk scraper to prevent data loss.")
                
                # Revert this opp to queued so we don't lose it
                with SessionLocal() as db:
                    opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
                    if opp:
                        opp.status = "queued"
                        db.commit()
                        
                raise e # Throw it up to run_all.py to stop the whole process

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
