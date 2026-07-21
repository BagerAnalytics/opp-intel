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
        import requests
        from bs4 import BeautifulSoup
        import re
        
        API_KEY = "7b28cf7f504c52e899376a3897d2cbc7"
        scraper_url = f"http://api.scraperapi.com?api_key={API_KEY}&url={base_url}&render=true"
        
        print(f"Navigating to {base_url} via ScraperAPI...")
        res = requests.get(scraper_url, timeout=60)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Extract links to the tender details pages
        anchors = soup.select('table.table tbody tr td a')
        links = []
        for a in anchors:
            href = a.get('href')
            if href and '/Home/OpportunityDetails' in href:
                links.append(href)
                
        unique_links = list(dict.fromkeys(links))
        target_links = unique_links[:5] # Limit to top 5 to save LLM costs
        
        print(f"Found {len(target_links)} new eTender links to scrape.")
        
        with SessionLocal() as db:
            for url in target_links:
                try:
                    full_url = url if url.startswith('http') else f"https://www.etenders.gov.za{url}"
                    existing = db.query(models.Opportunity).filter(models.Opportunity.link == full_url).first()
                    if existing:
                        print(f"Skipping already scraped: {full_url}")
                        continue
                        
                    print(f"Scraping eTender: {full_url}")
                    
                    article_url = f"http://api.scraperapi.com?api_key={API_KEY}&url={full_url}&render=true"
                    article_res = requests.get(article_url, timeout=60)
                    article_res.raise_for_status()
                    article_soup = BeautifulSoup(article_res.text, "html.parser")
                    
                    content = article_soup.select_one('.container')
                    raw_text = content.get_text(separator="\n", strip=True) if content else ''
                        
                    if not raw_text or len(raw_text) < 100:
                        print(f"Warning: Extracted text too short for {full_url}")
                        continue
                        
                    print("Running AI Extraction pipeline...")
                    extracted_data = extract_opportunity_data(raw_text, full_url)
                    if not extracted_data:
                        continue
                        
                    print("Running AI Matcher pipeline...")
                    match_result_str = generate_match_score(raw_text, "")
                    
                    import json
                    try:
                        cleaned_result = match_result_str.replace("```json", "").replace("```", "").strip()
                        match_data = json.loads(cleaned_result)
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
                    
        print("eTenders scraping run complete.")
    except Exception as e:
        print(f"Critical Scraper Error: {e}")

if __name__ == "__main__":
    scrape_etenders()
