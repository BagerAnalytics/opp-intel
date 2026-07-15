import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, Base
import models
from datetime import datetime, timedelta

def seed_db():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Seeding Opportunities...")
    opps = [
        models.Opportunity(
            name="USAID Agricultural Resilience Grant",
            funder="USAID",
            status="open",
            value="$500,000",
            description="Funding for innovative agricultural practices that improve climate resilience in sub-Saharan Africa.",
            link="https://www.usaid.gov/grants",
            match_score=92,
            closing_date=(datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d"),
            source="Scraper",
            match_reasoning="Strong alignment with your previous work in climate-smart agriculture and regional footprint.",
            opp_type="Grant",
            target_entity="Premier Agric"
        ),
        models.Opportunity(
            name="Gates Foundation Smallholder Farmer Initiative",
            funder="Bill & Melinda Gates Foundation",
            status="interested",
            value="$1,200,000",
            description="Scaling digital advisory services for smallholder farmers to increase yield.",
            link="https://www.gatesfoundation.org",
            match_score=88,
            closing_date=(datetime.now() + timedelta(days=120)).strftime("%Y-%m-%d"),
            source="LinkedIn",
            match_reasoning="Your digital platform matches their criteria for scaling tech solutions.",
            opp_type="Grant",
            target_entity="Both"
        ),
        models.Opportunity(
            name="FAO Food Security Innovation Challenge",
            funder="Food and Agriculture Organization (FAO)",
            status="drafting",
            value="$250,000",
            description="Seed funding for startups building food traceability systems.",
            link="https://www.fao.org",
            match_score=75,
            closing_date=(datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
            source="Manual",
            match_reasoning="Moderate match due to lower funding cap, but high thematic alignment.",
            opp_type="Grant",
            target_entity="Badger Analytics"
        ),
        models.Opportunity(
            name="World Bank Agri-Tech Expansion Fund",
            funder="World Bank",
            status="submitted",
            value="$3,000,000",
            description="Large scale funding for mature agri-tech companies expanding to new African markets.",
            link="https://www.worldbank.org",
            match_score=96,
            closing_date=(datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d"),
            source="Scraper",
            match_reasoning="Perfect match based on your recent expansion plans and revenue metrics.",
            opp_type="Award",
            target_entity="Both"
        ),
        models.Opportunity(
            name="UNICEF Nutrition Supply Chain Grant",
            funder="UNICEF",
            status="open",
            value="$750,000",
            description="Improving last-mile delivery for nutritional agricultural products.",
            link="https://www.unicef.org",
            match_score=45,
            closing_date=(datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d"),
            source="Scraper",
            match_reasoning="Low match. Your focus is primary production rather than last-mile delivery.",
            opp_type="Tender",
            target_entity="Premier Agric"
        )
    ]
    db.add_all(opps)

    print("Seeding Contacts...")
    contacts = [
        models.Contact(
            name="Sarah Jenkins",
            organization="USAID",
            role="Regional Director",
            email="s.jenkins@usaid.gov",
            linkedin_url="https://linkedin.com/in/sjenkins",
            relationship_strength="Warm",
            notes="Met at the Cape Town Agri-Tech summit last year. Very interested in our remote sensing work."
        ),
        models.Contact(
            name="Dr. Kwame Osei",
            organization="World Bank",
            role="Lead Agricultural Economist",
            email="kosei@worldbank.org",
            relationship_strength="Strong",
            notes="Has championed our previous proposals. Check in with him before the Q3 submission."
        ),
        models.Contact(
            name="Elena Rostova",
            organization="FAO",
            role="Innovation Lead",
            relationship_strength="Cold",
            notes="New contact found via LinkedIn. Need to secure a warm intro."
        )
    ]
    db.add_all(contacts)

    print("Seeding Compliance Documents...")
    docs = [
        models.ComplianceDocument(
            document_name="Tax Clearance Certificate",
            status="Uploaded",
            expiry_date=(datetime.now() + timedelta(days=200)).strftime("%Y-%m-%d"),
            file_url="https://example.com/tax-clearance.pdf",
            notes="Valid until next financial year."
        ),
        models.ComplianceDocument(
            document_name="Audited Financial Statements (2023)",
            status="Uploaded",
            expiry_date="2025-01-01",
            file_url="https://example.com/financials.pdf",
            notes="Prepared by KPMG."
        ),
        models.ComplianceDocument(
            document_name="Company Registration (CIPC)",
            status="Uploaded",
            file_url="https://example.com/registration.pdf",
            notes="Standard incorporation doc."
        ),
        models.ComplianceDocument(
            document_name="B-BBEE Certificate",
            status="Expired",
            expiry_date=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            notes="Currently under renewal with the agency. Expedite needed."
        ),
        models.ComplianceDocument(
            document_name="Director IDs",
            status="Missing",
            notes="Need high-res certified copies from all 3 directors."
        )
    ]
    db.add_all(docs)
    
    db.commit()
    db.close()
    print("Database seeded successfully with demo data!")

if __name__ == "__main__":
    seed_db()
