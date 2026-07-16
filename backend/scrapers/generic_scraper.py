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
from main import score_opportunity

def scrape_generic_link(url: str):
    """
    Scrapes any given URL, extracts text from the body,
    and runs the AI extraction and matching pipeline synchronously.
    """
    print(f"Starting Generic Scraper for URL: {url}")
    
    raw_text = ""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            Stealth().apply_stealth_sync(page)
            
            print(f"Navigating to {url}...")
            page.goto(url, timeout=60000)
            
            # Wait for body to be present
            page.wait_for_selector('body', timeout=10000)
            
            # Extract raw text from the entire body
            raw_text = page.evaluate('() => document.body.innerText')
            browser.close()
    except Exception as e:
        print(f"Error accessing {url}: {e}")
        return {"error": "Failed to access URL", "details": str(e)}

    if not raw_text or len(raw_text.strip()) < 50:
        return {"error": "Failed to extract meaningful text from URL"}

    print("Running AI Extraction pipeline...")
    extracted_data = extract_opportunity_data(raw_text, url)
    
    if not extracted_data:
        return {"error": "AI Extraction failed"}

    try:
        with SessionLocal() as db:
            # Check if it already exists
            existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
            if existing:
                return {"error": "Opportunity from this URL already exists in the database"}

            # Map the extracted data to the model
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
        result = scrape_generic_link(url)
        print(json.dumps(result))
    else:
        print("Please provide a URL as an argument.")
