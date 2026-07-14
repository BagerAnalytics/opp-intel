from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, get_db, engine
import models
from services.llm_service import generate_match_score, generate_strategy
from services.nas_service import nas_service
from scrapers.opportunity_desk import scrape_opportunity_desk
from scrapers.linkedin_opportunities import scrape_linkedin
from apscheduler.schedulers.background import BackgroundScheduler

# Create tables in the database if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="OppIntel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from datetime import datetime
from dateutil import parser

def run_all_scrapers():
    print("Running scheduled scrapers...")
    try:
        scrape_opportunity_desk()
        scrape_linkedin()
        print("Scrapers completed successfully.")
        
        # Auto-close logic
        with SessionLocal() as db:
            opps = db.query(models.Opportunity).all()
            now = datetime.now()
            closed_count = 0
            for opp in opps:
                if opp.closing_date and opp.status not in ["won", "lost", "closed"]:
                    try:
                        dt = parser.parse(opp.closing_date, fuzzy=True)
                        if dt < now:
                            opp.status = "closed"
                            closed_count += 1
                    except Exception:
                        pass # Ignore if date is unparseable
            if closed_count > 0:
                db.commit()
                print(f"Auto-closed {closed_count} expired opportunities.")
                
    except Exception as e:
        print(f"Error running scrapers: {e}")

@app.on_event("startup")
def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every Monday at 2:00 AM
    scheduler.add_job(run_all_scrapers, trigger='cron', day_of_week='mon', hour=2, minute=0)
    scheduler.start()
    print("APScheduler started: Bots will run every Monday at 02:00 AM.")
    
    # Auto-migrate the database to add the new strategy column
    from sqlalchemy import text
    from database import engine
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS strategy TEXT;"))
            print("Successfully added strategy column to database.")
    except Exception as e:
        print(f"Migration notice (safe to ignore): {e}")

@app.post("/api/scrapers/run")
def trigger_scrapers():
    """Manually trigger all scrapers to run immediately."""
    run_all_scrapers()
    return {"status": "Scrapers executed successfully"}

@app.get("/")
def read_root():
    return {"status": "OppIntel Backend Running"}

@app.get("/api/opportunities")
def get_opportunities(db: Session = Depends(get_db)):
    """Fetch all opportunities from the database."""
    opps = db.query(models.Opportunity).all()
    return opps

@app.put("/api/opportunities/{opp_id}/status")
def update_opportunity_status(opp_id: int, status: str, db: Session = Depends(get_db)):
    """Update the pipeline status of an opportunity."""
    opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opp.status = status
    db.commit()
    return {"status": "success", "new_status": status}

@app.post("/api/opportunities/{opp_id}/score")
def score_opportunity(opp_id: int, db: Session = Depends(get_db)):
    """Generate a match score for a specific opportunity using the LLM."""
    opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Gather Feedback Loop context (Won/Lost opportunities)
    won_opps = db.query(models.Opportunity).filter(models.Opportunity.status == "won").all()
    lost_opps = db.query(models.Opportunity).filter(models.Opportunity.status == "lost").all()
    
    feedback_context = "Historical Business Context:\n"
    if won_opps:
        feedback_context += "We have WON these types of opportunities in the past: " + ", ".join([o.name for o in won_opps]) + "\n"
    if lost_opps:
        feedback_context += "We have LOST these types of opportunities in the past (avoid or adjust strategy): " + ", ".join([o.name for o in lost_opps]) + "\n"
    
    # Combine deep fields for the LLM to analyze
    deep_context = f"Title: {opp.name}\n"
    if opp.description: deep_context += f"Summary: {opp.description}\n"
    if opp.eligibility_criteria: deep_context += f"Eligibility: {opp.eligibility_criteria}\n"
    if opp.selection_criteria: deep_context += f"Selection: {opp.selection_criteria}\n"
    if opp.benefits: deep_context += f"Benefits: {opp.benefits}\n"
    
    # Run the LLM Matcher with feedback loop
    result = generate_match_score(deep_context, feedback_context)
    
    # Run the Strategy Generator
    historical_context = opp.past_winners or "No past winners data available."
    strategy = generate_strategy(deep_context, historical_context, feedback_context)
    
    import json
    try:
        data = json.loads(result)
        opp.match_score = data.get("match_score")
        opp.match_reasoning = data.get("reasoning") # Ensure reasoning is saved if we added it
        opp.strategy = strategy
        db.commit()
        
        # Include strategy in response
        data["strategy"] = strategy
        return data
    except Exception as e:
        return {"error": "Failed to parse LLM response", "details": str(e)}

class ComplianceDocCreate(BaseModel):
    document_name: str
    status: Optional[str] = "Missing"
    expiry_date: Optional[str] = None
    file_url: Optional[str] = None
    notes: Optional[str] = None

@app.get("/api/compliance")
def get_compliance_docs(db: Session = Depends(get_db)):
    """Fetch all compliance documents."""
    return db.query(models.ComplianceDocument).all()

@app.post("/api/compliance")
def create_compliance_doc(doc: ComplianceDocCreate, db: Session = Depends(get_db)):
    """Add a new compliance document record."""
    new_doc = models.ComplianceDocument(**doc.dict())
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@app.put("/api/compliance/{doc_id}")
def update_compliance_doc(doc_id: int, doc: ComplianceDocCreate, db: Session = Depends(get_db)):
    """Update a compliance document record."""
    existing_doc = db.query(models.ComplianceDocument).filter(models.ComplianceDocument.id == doc_id).first()
    if not existing_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    for key, value in doc.dict(exclude_unset=True).items():
        setattr(existing_doc, key, value)
    
    db.commit()
    db.refresh(existing_doc)
    return existing_doc

@app.delete("/api/compliance/{doc_id}")
def delete_compliance_doc(doc_id: int, db: Session = Depends(get_db)):
    """Delete a compliance document record."""
    doc = db.query(models.ComplianceDocument).filter(models.ComplianceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}

@app.get("/api/compliance/sync")
def sync_compliance():
    """Trigger a WebDAV sync to list compliance documents."""
    docs = nas_service.list_compliance_documents()
    return {"documents_found": len(docs), "files": docs}

from pydantic import BaseModel
from typing import Optional

class ContactCreate(BaseModel):
    name: str
    organization: str
    role: Optional[str] = None
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    relationship_strength: Optional[str] = "Cold"
    notes: Optional[str] = None

@app.get("/api/contacts")
def get_contacts(db: Session = Depends(get_db)):
    """Fetch all contacts from the CRM."""
    contacts = db.query(models.Contact).all()
    return contacts

@app.post("/api/contacts")
def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    """Add a new contact to the CRM."""
    new_contact = models.Contact(**contact.dict())
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@app.delete("/api/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Delete a contact from the CRM."""
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}
