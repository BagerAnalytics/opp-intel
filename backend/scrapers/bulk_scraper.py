import os
import sys
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal
from scrapers.generic_scraper import extract_from_url

def run_bulk_scraper(tasks):
    print(f"Starting bulk import for {len(tasks)} items...")
    
    for task in tasks:
        opp_id = task.get("id")
        url = task.get("url")
        print(f"\n--- Extracting ID {opp_id}: {url} ---")
        
        try:
            # Check if it was deleted while in queue
            with SessionLocal() as db:
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
