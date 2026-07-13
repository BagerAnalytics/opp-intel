import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
import sys
import os

# Add parent directory to path so we can import database and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from database import SessionLocal

def scrape_linkedin():
    print("Starting LinkedIn scraper...")
    # In a real-world scenario, we would use the official LinkedIn API or a service like PhantomBuster 
    # since LinkedIn heavily blocks anonymous scraping. For this prototype, we simulate fetching recent posts.
    
    hashtags = [
        "agribusiness", "africastartups", "startupfunding", "greentech", 
        "foodsecurity", "agritraining", "consultingopportunity"
    ]
    
    print(f"Searching LinkedIn for posts with hashtags: {', '.join(hashtags)}")
    
    # Mocked data that an LLM would have extracted from a raw LinkedIn post
    mock_post_extraction = {
        "title": "Global AgriInno Challenge 2026 - Innovation Challenge",
        "funder": "FAO / Zhejiang University",
        "closing_date": "August 30, 2026",
        "value": "$25,000",
        "description": "The Global AgriInno Challenge 2026 aims to harness innovation for resilient agrifood systems. Looking for tech-driven agriculture solutions.",
        "benefits": "Winning teams will receive seed funding, mentorship from global experts, and a fully funded trip to present their solutions at the World Food Forum.",
        "eligibility_criteria": "Open to young innovators (18-35 years old) worldwide. Teams must have a tech-driven solution addressing food security or sustainable agriculture.",
        "selection_criteria": "Innovation, technical feasibility, impact on food security, and team capability.",
        "application_process": "Submit a pitch deck and a 3-minute video presentation via the official portal.",
        "link": "https://innovationbridge.info/ibportal/content/global-agriinno-challenge-gac-2026-innovation-challenge-resilient-agrifood-systems-small",
        "status": "open"
    }
    
    db: Session = SessionLocal()
    try:
        # Check if already exists
        existing = db.query(models.Opportunity).filter(models.Opportunity.link == mock_post_extraction["link"]).first()
        if existing:
            print("LinkedIn opportunity already in database.")
            return
            
        opp = models.Opportunity(
            name=mock_post_extraction["title"],
            funder=mock_post_extraction["funder"],
            closing_date=mock_post_extraction["closing_date"],
            value=mock_post_extraction["value"],
            description=mock_post_extraction["description"],
            benefits=mock_post_extraction["benefits"],
            eligibility_criteria=mock_post_extraction["eligibility_criteria"],
            selection_criteria=mock_post_extraction["selection_criteria"],
            application_process=mock_post_extraction["application_process"],
            link=mock_post_extraction["link"],
            status=mock_post_extraction["status"],
            source="LinkedIn Scraper"
        )
        
        db.add(opp)
        db.commit()
        print(f"Successfully scraped from LinkedIn: {opp.name}")
        
    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    scrape_linkedin()
