import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
import sys
import os

# Add parent directory to path so we can import database and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal

def scrape_opportunity_desk():
    print("Starting OpportunityDesk scraper...")
    # For demo purposes, we will scrape the specific URL the user provided 
    # In production, we would scrape the homepage and loop through links
    url = "https://opportunitydesk.org/2026/07/10/ecowas-youth-and-women-entrepreneurship-programme-2026/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch page. Status: {response.status_code}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract Title
    title = soup.find('h1').text.strip() if soup.find('h1') else "ECOWAS Youth and Women Entrepreneurship Programme (EYWEP) 2026"
    
    # Extract content blocks (OpportunityDesk usually uses standard headers for Benefits, Eligibility, etc.)
    # We will grab all paragraphs and headers
    content_div = soup.find('div', class_='entry-content') or soup.find('article')
    
    if not content_div:
        print("Could not find main content area.")
        return
        
    description = ""
    benefits = ""
    eligibility = ""
    selection = ""
    application = ""
    
    current_section = "description"
    
    for element in content_div.find_all(['h2', 'h3', 'h4', 'strong', 'p', 'ul', 'ol']):
        if element.name in ['h2', 'h3', 'h4', 'strong']:
            text_lower = element.text.lower()
            if 'benefit' in text_lower or 'prize' in text_lower or 'award' in text_lower:
                current_section = "benefits"
            elif 'eligibil' in text_lower or 'requirement' in text_lower:
                current_section = "eligibility"
            elif 'selection' in text_lower or 'criteria' in text_lower:
                current_section = "selection"
            elif 'application' in text_lower or 'apply' in text_lower:
                current_section = "application"
            continue
            
        if element.name in ['p', 'ul', 'ol']:
            text = element.text.strip()
            if not text:
                continue
                
            if current_section == "description":
                description += text + "\n\n"
            elif current_section == "benefits":
                benefits += text + "\n\n"
            elif current_section == "eligibility":
                eligibility += text + "\n\n"
            elif current_section == "selection":
                selection += text + "\n\n"
            elif current_section == "application":
                application += text + "\n\n"
                
    print(f"Extracted: {title}")
    
    db: Session = SessionLocal()
    try:
        # Check if already exists
        existing = db.query(models.Opportunity).filter(models.Opportunity.link == url).first()
        if existing:
            print("Opportunity already in database.")
            return
            
        opp = models.Opportunity(
            name=title,
            funder="ECOWAS / AUDA-NEPAD", # Hardcoded for demo, normally extracted or inferred by LLM
            closing_date="July 16, 2026",
            value="$15,000",
            description=description.strip()[:500] + "...", # Short summary for the card
            benefits=benefits.strip(),
            eligibility_criteria=eligibility.strip(),
            selection_criteria=selection.strip(),
            application_process=application.strip(),
            link=url,
            status="open"
        )
        
        db.add(opp)
        db.commit()
        print("Successfully saved to database!")
        
    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    scrape_opportunity_desk()
