import os
import sys
import json
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal
from services.llm_service import extract_opportunity_data
from services.scorer_service import score_opportunity

def extract_from_url(url: str, opp_id: int = None):
    raw_text = ""
    try:
        print("Launching headless browser...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            Stealth().apply_stealth_sync(page)
            page.goto(url, wait_until="networkidle", timeout=60000)
            raw_text = page.evaluate("document.body.innerText")
            browser.close()
    except Exception as e:
        print(f"Playwright failed: {e}. Falling back to requests...")
        import requests
        from bs4 import BeautifulSoup
        try:
            res = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            soup = BeautifulSoup(res.text, "html.parser")
            raw_text = soup.get_text(separator="\n", strip=True)
        except Exception as ex:
            return {"error": f"Failed to fetch URL with both playwright and requests. Details: {ex}"}
            
    print(f"Extracted {len(raw_text)} characters. Sending to LLM for parsing...")
    
    # 2. Use LLM to extract structured data
    extracted_data = extract_opportunity_data(raw_text, url)
    
    if not extracted_data:
        return {"error": "Failed to extract data using LLM"}
        
    print("Parsed data:", extracted_data.get("name"))
    
    # 3. Save to database
    try:
        with SessionLocal() as db:
            if opp_id:
                new_opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
                if not new_opp:
                    return {"error": "Opportunity not found"}
                
                # Update existing
                new_opp.description = extracted_data.get("description", new_opp.description)
                new_opp.benefits = extracted_data.get("benefits", new_opp.benefits)
                new_opp.eligibility_criteria = extracted_data.get("eligibility_criteria", new_opp.eligibility_criteria)
                new_opp.selection_criteria = extracted_data.get("selection_criteria", new_opp.selection_criteria)
                new_opp.application_process = extracted_data.get("application_process", new_opp.application_process)
                new_opp.past_winners = extracted_data.get("past_winners", new_opp.past_winners)
            else:
                # Check if it already exists
                existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
                if existing:
                    return {"error": "Opportunity from this URL already exists in the database"}

                # Create new
                new_opp = models.Opportunity(
                    name=extracted_data.get("name", "Unknown Opportunity"),
                    funder=extracted_data.get("funder", ""),
                    value=extracted_data.get("value", ""),
                    closing_date=extracted_data.get("closing_date", "Unknown"),
                    description=extracted_data.get("description", ""),
                    benefits=extracted_data.get("benefits", ""),
                    eligibility_criteria=extracted_data.get("eligibility_criteria", ""),
                    selection_criteria=extracted_data.get("selection_criteria", ""),
                    application_process=extracted_data.get("application_process", ""),
                    past_winners=extracted_data.get("past_winners", ""),
                    link=url,
                    source="Smart Link Extraction",
                    status="open"
                )
                db.add(new_opp)
                
            db.commit()
            db.refresh(new_opp)
            
            # Automatically score and generate strategy
            print("Running AI Matcher pipeline...")
            score_opportunity(new_opp.id, db)
            db.refresh(new_opp)
            
            print("Successfully extracted and scored!")
            
            # Return serialized dict
            return {
                "id": new_opp.id,
                "name": new_opp.name,
                "funder": new_opp.funder,
                "match_score": new_opp.match_score,
                "strategy": new_opp.strategy
            }
            
    except Exception as e:
        print(f"Database/Scoring Error: {e}")
        return {"error": "Failed to save or score opportunity", "details": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1]
        opp_id = None
        if len(sys.argv) > 2:
            opp_id = int(sys.argv[2])
            
        print(f"Starting extraction for URL: {url}")
        
        # We need an event loop for playwright sync API
        result = extract_from_url(url, opp_id)
        
        # Print the final result as JSON so the backend can parse it
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No URL provided"}))
