import requests
import time

def smart_fetch(url: str, api_key: str, render: bool = False, max_retries: int = 2) -> str:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    last_error = None
    for attempt in range(max_retries):
        try:
            res = requests.get(url, headers=headers, timeout=15)
            if res.status_code == 200: return res.text
            elif res.status_code == 404: return ""
            elif res.status_code in [403, 401, 406, 429, 503]: break
            else: res.raise_for_status()
        except requests.RequestException as e:
            last_error = e
            time.sleep(1)
            
    render_param = 'true' if render else 'false'
    scraper_url = f'http://api.scraperapi.com?api_key={api_key}&url={url}&render={render_param}'
    for attempt in range(max_retries):
        try:
            res = requests.get(scraper_url, timeout=60)
            res.raise_for_status()
            return res.text
        except requests.RequestException as e:
            last_error = e
            time.sleep(2)
            
    print(f'Failed to fetch {url}')
    return ""

import json
import models
from services.llm_service import extract_opportunity_data, generate_match_score

def validate_and_queue_link(db, url: str, source: str, api_key: str):
    """
    Fetches the HTML of the URL and asks the LLM to validate it.
    If the LLM returns an empty dict or it's clearly not an opportunity, it returns False.
    If valid, generates a match score and inserts into the database, returning True.
    """
    # Check if it already exists to save time
    existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
    if existing:
        return False
        
    print(f"Validating discovered link: {url}")
    html_content = smart_fetch(url, api_key, render=False)
    if not html_content:
        return False
        
    # Phase 1: Lightweight Extraction
    basic_data = extract_opportunity_data(html_content, url)
    
    # If the LLM rejected it as a non-opportunity or closed opportunity
    if not basic_data or not basic_data.get("name"):
        print(f"REJECTED by AI: Not a valid opportunity ({url})")
        return False
        
    name = basic_data.get("name")
    if name == "Unknown" or "Untitled" in name:
        return False
        
    # Match Scoring
    description = basic_data.get("description", "")
    match_score = 0
    target_entity = "Unknown"
    
    if description:
        match_json = generate_match_score(description)
        try:
            match_data = json.loads(match_json)
            match_score = match_data.get("match_score", 0)
            target_entity = match_data.get("target_entity", "Unknown")
        except Exception:
            pass
            
    # Insert into DB
    new_opp = models.Opportunity(
        name=name,
        link=url,
        funder=basic_data.get("funder", "Unknown"),
        closing_date=basic_data.get("closing_date", "Open"),
        value=basic_data.get("value", "Unknown"),
        description=description,
        benefits=basic_data.get("benefits", ""),
        eligibility_criteria=basic_data.get("eligibility_criteria", ""),
        status="queued",
        source=source,
        target_entity=target_entity,
        match_score=match_score,
        raw_text=html_content
    )
    
    db.add(new_opp)
    db.commit()
    print(f"ACCEPTED and Queued: {name}")
    return True
