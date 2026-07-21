import os
import sys
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# Add parent directory to path so we can import database, models, and services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal
from services.llm_service import extract_opportunity_data, generate_match_score

def scrape_opportunity_desk():
    print("Starting OpportunityDesk Scraper...")
    base_url = "https://opportunitydesk.org/"
    
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
        
        # Extract all opportunity links from the articles on the homepage
        anchors = soup.select('article a')
        links = []
        for a in anchors:
            href = a.get('href')
            if href and re.search(r'/\d{4}/\d{2}/\d{2}/', href):
                links.append(href)
        
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
                    article_url = f"http://api.scraperapi.com?api_key={API_KEY}&url={url}&render=true"
                    article_res = requests.get(article_url, timeout=60)
                    article_res.raise_for_status()
                    article_soup = BeautifulSoup(article_res.text, "html.parser")
                    
                    # Extract the raw text from the article content
                    content = article_soup.select_one('.entry-content') or article_soup.select_one('article')
                    raw_text = content.get_text(separator="\n", strip=True) if content else ''
                    
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
                    match_result_str = generate_match_score(raw_text, "")
                    
                    import json
                    try:
                        # Strip markdown if any
                        cleaned_result = match_result_str.replace("```json", "").replace("```", "").strip()
                        match_data = json.loads(cleaned_result)
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
                    
        print("OpportunityDesk scraping run complete.")
    except Exception as e:
        print(f"Critical Scraper Error: {e}")

if __name__ == "__main__":
    scrape_opportunity_desk()
