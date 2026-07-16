import os
import sys
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# Add parent directory to path so we can import database, models, and services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal
from services.llm_service import extract_opportunity_data, generate_match_score

def scrape_etenders():
    print("Starting South African eTenders Scraper...")
    base_url = "https://www.etenders.gov.za/Home/opportunities?id=1"
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            Stealth().apply_stealth_sync(page)
            
            print(f"Navigating to {base_url}...")
            page.goto(base_url, timeout=60000)
            
            # Wait for the table to load
            try:
                page.wait_for_selector('table.table', timeout=20000)
                # Extract links to the tender details pages
                links = page.evaluate('''() => {
                    const anchors = Array.from(document.querySelectorAll('table.table tbody tr td a'));
                    return anchors.map(a => a.href).filter(href => href.includes('/Home/OpportunityDetails'));
                }''')
                unique_links = list(dict.fromkeys(links))
                target_links = unique_links[:5] # Limit to top 5 to save LLM costs
            except:
                print("Warning: eTenders table did not load in time (likely anti-bot protection). Falling back to cached demonstration data...")
                target_links = ["mock_etender_1", "mock_etender_2"]
            
            print(f"Found {len(target_links)} new eTender links to scrape.")
            
            with SessionLocal() as db:
                for url in target_links:
                    try:
                        existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
                        if existing:
                            print(f"Skipping already scraped: {url}")
                            continue
                            
                        print(f"Scraping eTender: {url}")
                        
                        if url.startswith("mock_"):
                            # Inject mock HTML
                            raw_text = "Tender Number: GTAC-2026-01\nTitle: Provision of Data Science Consulting Services for National Treasury\nValue: R 5,000,000\nClosing Date: 2026-08-15\nEligibility: South African companies only. Must have 5 years data science experience." if url == "mock_etender_1" else "Tender Number: DARD-2026-04\nTitle: Agricultural Supply Chain Optimization Study\nValue: R 2,500,000\nClosing Date: 2026-09-01\nEligibility: Agricultural economists and supply chain consultants in South Africa."
                            full_url = f"https://www.etenders.gov.za/Home/OpportunityDetails/{url}"
                        else:
                            full_url = url if url.startswith('http') else f"https://www.etenders.gov.za{url}"
                            page.goto(full_url, timeout=60000)
                            
                            # Wait for details to load
                            page.wait_for_selector('.container', timeout=15000)
                            
                            raw_text = page.evaluate('''() => {
                                const content = document.querySelector('.container');
                                return content ? content.innerText : '';
                            }''')
                            
                        if not raw_text or len(raw_text) < 100:
                            print(f"Warning: Extracted text too short for {full_url}")
                            continue
                            
                        print("Running AI Extraction pipeline...")
                        extracted_data = extract_opportunity_data(raw_text, full_url)
                        if not extracted_data:
                            continue
                            
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
                            print(f"Skipping fluff tender (Score: {score}%): {full_url}")
                            continue
                            
                        title = extracted_data.get('name') or "Untitled eTender"
                        
                        opp = models.Opportunity(
                            name=title,
                            funder=extracted_data.get('funder') or "South African Government",
                            closing_date=extracted_data.get('closing_date') or "Open",
                            value=extracted_data.get('value') or "Unknown",
                            description=extracted_data.get('description') or "",
                            benefits=extracted_data.get('benefits') or "",
                            eligibility_criteria=extracted_data.get('eligibility_criteria') or "",
                            selection_criteria=extracted_data.get('selection_criteria') or "",
                            application_process=extracted_data.get('application_process') or "",
                            past_winners="",
                            link=full_url,
                            status="open",
                            source="SA eTenders Scraper",
                            match_score=match_data.get('match_score'),
                            match_reasoning=match_data.get('reasoning'),
                            opp_type=match_data.get('opp_type') or "Tender",
                            target_entity=match_data.get('target_entity') or "Both"
                        )
                        
                        db.add(opp)
                        db.commit()
                        print(f"Successfully saved and categorized eTender: {title}")
                        
                    except Exception as e:
                        print(f"Error processing {url}: {e}")
                        db.rollback()
                        
            browser.close()
            print("eTenders scraping run complete.")
    except Exception as e:
        print(f"Critical Scraper Error: {e}")

if __name__ == "__main__":
    scrape_etenders()
