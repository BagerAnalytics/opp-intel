from sqlalchemy import Column, Integer, String, Text, Date, Boolean
from database import Base

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    # Basic Fields
    name = Column(String, index=True)
    funder = Column(String, nullable=True)
    status = Column(String, nullable=True)
    value = Column(String, nullable=True)
    description = Column(String, nullable=True)
    link = Column(String, nullable=True)
    opp_type = Column(String, nullable=True)     # "Grant", "Tender", "Award"
    target_entity = Column(String, nullable=True) # "Premier Agric", "Badger Analytics", "Both"
    
    # Deep Scraper Fields
    benefits = Column(Text, nullable=True)
    eligibility_criteria = Column(Text, nullable=True)
    selection_criteria = Column(Text, nullable=True)
    application_process = Column(Text, nullable=True)
    past_winners = Column(Text, nullable=True)
    
    # AI Engine Fields
    match_score = Column(Integer, nullable=True)
    opening_date = Column(String, nullable=True) # Storing as string to handle varying formats like "-"
    closing_date = Column(String, nullable=True)
    applied = Column(String, nullable=True)      # e.g. "Applied", "Not Applied"
    outcome = Column(String, nullable=True)      # e.g. "Submitted", "Won", "Lost"
    feedback_notes = Column(Text, nullable=True)
    notes_when_applying = Column(Text, nullable=True)
    prize_amount = Column(String, nullable=True)

    # Added fields for the new scraping pipeline
    source = Column(String, nullable=True)       # e.g. "CSV_Import", "OpportunityDesk"
    winner_analysis = Column(Text, nullable=True) # "who has won and how they did it"
    match_reasoning = Column(Text, nullable=True)
    strategy = Column(Text, nullable=True)        # The AI-generated winning strategy

class Portal(Base):
    __tablename__ = "portals"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    status = Column(String, default="Active")
    last_scraped = Column(String, nullable=True)
    opportunities_found = Column(Integer, default=0)

class ScraperProgress(Base):
    __tablename__ = "scraper_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    is_active = Column(Boolean, default=False)
    current_task = Column(String, default="Idle")
    progress_percent = Column(Integer, default=0)
    updated_at = Column(String, nullable=True)

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    organization = Column(String, index=True) # E.g. FAO, ECOWAS
    role = Column(String, nullable=True)
    email = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    relationship_strength = Column(String, nullable=True) # E.g. "Cold", "Warm", "Strong"
    notes = Column(Text, nullable=True)

class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_name = Column(String, index=True)
    status = Column(String, default="Missing") # "Missing", "Uploaded", "Expired"
    expiry_date = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
