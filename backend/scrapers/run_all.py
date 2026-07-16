import os
import sys

# Add parent directory to path so we can import database, models, and services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.opportunity_desk import scrape_opportunity_desk
from scrapers.linkedin_opportunities import scrape_linkedin
from scrapers.etenders_sa import scrape_etenders
from scrapers.discovery_scraper import scrape_discovery_engine
from database import engine
from sqlalchemy import text
import models

def run_all_scrapers():
    print("Running scheduled scrapers from isolated process...")
    try:
        scrape_discovery_engine()
        scrape_opportunity_desk()
        scrape_etenders()
        scrape_linkedin()
        print("Scrapers completed successfully.")
        
    except Exception as e:
        print(f"Scraper execution error: {e}")

if __name__ == "__main__":
    run_all_scrapers()
