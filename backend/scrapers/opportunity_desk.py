import os
import sys
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth

# Add parent directory to path so we can import database, models, and services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal
from services.llm_service import extract_opportunity_data, generate_match_score

def scrape_opportunity_desk():
    print("Starting OpportunityDesk Scraper...")
    base_url = "https://opportunitydesk.org/"
    
    try:
        with sync_playwright() as p:
            # We use headless=True for background running
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            stealth(page)
            
            # Navigate to homepage to get the latest opportunities
            print(f"Navigating to {base_url}...")
            page.goto(base_url, timeout=60000)
            
            # Extract all opportunity links from the articles on the homepage
            links = page.evaluate('''() => {
                const anchors = Array.from(document.querySelectorAll('article a'));
                return anchors.map(a => a.href).filter(href => href.match(/\\/\\d{4}\\/\\d{2}\\/\\d{2}\\//));
            }''')
            
            # Remove duplicates while preserving order
            unique_links = list(dict.fromkeys(links))
            # Limit to the top 5 to save LLM costs during demo
            target_links = unique_links[:5]
            
            print(f"Found {len(target_links)} new opportunity links to scrape.")
            
            with SessionLocal() as db:
                for url in target_links:
                    try:
                        # Check if it already exists to avoid redundant processing
                        existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
                        if existing:
                            print(f"Skipping already scraped: {url}")
                            continue
                            
                        print(f"Scraping: {url}")
                        page.goto(url, timeout=60000)
                        
                        # Wait for content to load
                        page.wait_for_selector('article', timeout=10000)
                        
                        # Extract the raw text from the article content
                        raw_text = page.evaluate('''() => {
                            const content = document.querySelector('.entry-content') || document.querySelector('article');
                            return content ? content.innerText : '';
                        }''')
                        
                        if not raw_text or len(raw_text) < 100:
                            print(f"Warning: Extracted text too short for {url}")
                            continue
                        
                        # 1. AI Extraction
                        print("Running AI Extraction pipeline...")
                        extracted_data = extract_opportunity_data(raw_text, url)
                        if not extracted_data:
                            continue
                            
                        # 2. AI Matcher (Target Entity and Opp Type)
                        print("Running AI Matcher pipeline...")
                        match_result_str = generate_match_score(raw_text)
                        
                        import json
                        try:
                            match_data = json.loads(match_result_str)
                        except:
                            match_data = {"match_score": 0, "reasoning": "Failed to parse AI match response."}
                        
                        # Anti-Fluff Filter
                        score = match_data.get('match_score') or 0
                        if score < 30:
                            print(f"Skipping fluff opportunity (Score: {score}%): {url}")
                            continue
                        
                        # 3. Save to Database
                        title = extracted_data.get('name') or "Untitled Opportunity"
                        
                        opp = models.Opportunity(
                            name=title,
                            funder=extracted_data.get('funder') or "Unknown",
                            closing_date=extracted_data.get('closing_date') or "Open",
                            value=extracted_data.get('value') or "Unknown",
                            description=extracted_data.get('description') or "",
                            benefits=extracted_data.get('benefits') or "",
                            eligibility_criteria=extracted_data.get('eligibility_criteria') or "",
                            selection_criteria=extracted_data.get('selection_criteria') or "",
                            application_process=extracted_data.get('application_process') or "",
                            past_winners="", # Usually not found in the raw text directly
                            link=url,
                            status="open",
                            source="OpportunityDesk AI Scraper",
                            match_score=match_data.get('match_score'),
                            match_reasoning=match_data.get('reasoning'),
                            opp_type=match_data.get('opp_type') or "Other",
                            target_entity=match_data.get('target_entity') or "Both"
                        )
                        
                        db.add(opp)
                        db.commit()
                        print(f"Successfully saved and categorized: {title}")
                        
                    except Exception as e:
                        print(f"Error processing {url}: {e}")
                        db.rollback()
                        
            browser.close()
            print("OpportunityDesk scraping run complete.")
    except Exception as e:
        print(f"Critical Scraper Error: {e}")

if __name__ == "__main__":
    scrape_opportunity_desk()
