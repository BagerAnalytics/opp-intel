from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import SessionLocal, get_db, engine
import models
from services.llm_service import generate_match_score, generate_strategy
from services.nas_service import nas_service
from scrapers.opportunity_desk import scrape_opportunity_desk
from scrapers.linkedin_opportunities import scrape_linkedin
from scrapers.etenders_sa import scrape_etenders

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

from apscheduler.schedulers.background import BackgroundScheduler
import subprocess
import sys
import os

# The scrapers are run via an isolated subprocess script
# (backend/scrapers/run_all.py) to prevent asyncio thread deadlocks 
# between FastAPI's BackgroundTasks and Playwright's sync_api.

def run_scrapers_subprocess():
    print("Cron Job: Triggering scheduled scrapers...")
    script_path = os.path.join(os.path.dirname(__file__), "scrapers", "run_all.py")
    subprocess.Popen([sys.executable, script_path])

@app.on_event("startup")
def start_scheduler():
    print("Server starting up. Initializing APScheduler for daily scrapers...")
    scheduler = BackgroundScheduler()
    # Run every day at midnight
    scheduler.add_job(run_scrapers_subprocess, 'cron', hour=0, minute=0)
    scheduler.start()
    print("APScheduler started successfully.")

    # Auto-migrate the database to add the new strategy column
    from sqlalchemy import text
    from database import engine
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS strategy TEXT;"))
            conn.execute(text("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS opp_type TEXT;"))
            conn.execute(text("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS target_entity TEXT;"))
            print("Successfully added strategy, opp_type, and target_entity columns to database.")
    except Exception as e:
        print(f"Migration notice (safe to ignore): {e}")

import subprocess
import sys

@app.get("/api/scrapers/run")
@app.post("/api/scrapers/run")
def trigger_scrapers():
    """Manually trigger all scrapers to run immediately in a detached process."""
    # We use Popen so it runs in the background and doesn't block the API response
    subprocess.Popen([sys.executable, "scrapers/run_all.py"])
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

class OpportunityCreate(BaseModel):
    name: str
    funder: Optional[str] = None
    value: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    closing_date: Optional[str] = None
    opp_type: Optional[str] = None
    target_entity: Optional[str] = None
    benefits: Optional[str] = None
    eligibility_criteria: Optional[str] = None
    selection_criteria: Optional[str] = None
    application_process: Optional[str] = None
    past_winners: Optional[str] = None

@app.post("/api/opportunities/manual")
def add_manual_opportunity(opp: OpportunityCreate, db: Session = Depends(get_db)):
    """Manually add an opportunity and automatically score it with AI."""
    if opp.link:
        existing = db.query(models.Opportunity).filter(models.Opportunity.link == opp.link).first()
        if existing:
            raise HTTPException(status_code=409, detail="Opportunity from this URL already exists in the database")

    new_opp = models.Opportunity(
        **opp.dict(),
        status="open",
        source="Manual Entry"
    )
    db.add(new_opp)
    db.commit()
    db.refresh(new_opp)
    
    # Automatically trigger the AI Matcher
    try:
        score_opportunity(new_opp.id, db)
        db.refresh(new_opp)
    except Exception as e:
        print(f"Error automatically scoring manual opportunity: {e}")
        
    return new_opp

class LinkExtractRequest(BaseModel):
    url: str

@app.post("/api/opportunities/extract-link")
def extract_link(req: LinkExtractRequest):
    """Extract an opportunity from a URL out-of-process and return the result synchronously."""
    import subprocess
    import sys
    import json
    
    try:
        result = subprocess.run(
            [sys.executable, "scrapers/generic_scraper.py", req.url],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        # The script prints debug info and then JSON at the end.
        output_lines = result.stdout.strip().split('\n')
        last_line = output_lines[-1] if output_lines else ""
        
        try:
            data = json.loads(last_line)
            if "error" in data:
                raise HTTPException(status_code=500, detail=data["error"])
            return data
        except json.JSONDecodeError:
            print("Failed to parse JSON from scraper:", result.stdout)
            print("Stderr:", result.stderr)
            raise HTTPException(status_code=500, detail="Failed to parse extraction result.")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Extraction timed out after 2 minutes.")

@app.post("/api/opportunities/{opp_id}/re-extract")
def re_extract_opportunity(opp_id: int, db: Session = Depends(get_db)):
    """Re-extract deep details for an existing opportunity using its link."""
    opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if not opp.link:
        raise HTTPException(status_code=400, detail="Opportunity does not have a link to extract from.")

    import subprocess
    import sys
    import json
    
    try:
        result = subprocess.run(
            [sys.executable, "scrapers/generic_scraper.py", opp.link, str(opp.id)],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        output_lines = result.stdout.strip().split('\n')
        last_line = output_lines[-1] if output_lines else ""
        
        try:
            data = json.loads(last_line)
            if "error" in data:
                raise HTTPException(status_code=500, detail=data["error"])
            return data
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to parse extraction result.")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Extraction timed out after 2 minutes.")

@app.delete("/api/opportunities/{opp_id}")
def delete_opportunity(opp_id: int, db: Session = Depends(get_db)):
    """Delete an opportunity."""
    opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    db.delete(opp)
    db.commit()
    return {"message": "Opportunity deleted successfully"}

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
        # Strip markdown json tags if present
        cleaned_result = result.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned_result)
        opp.match_score = data.get("match_score")
        opp.match_reasoning = data.get("reasoning")
        
        # New classification fields
        if "opp_type" in data:
            opp.opp_type = data.get("opp_type")
        if "target_entity" in data:
            opp.target_entity = data.get("target_entity")
            
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

from fastapi import UploadFile, File
import shutil
import os

@app.get("/api/compliance/sync")
def sync_compliance():
    """Trigger a WebDAV sync to list compliance documents."""
    docs = nas_service.list_files()
    return {"documents_found": len(docs), "files": docs}

@app.post("/api/compliance/{doc_id}/upload")
async def upload_compliance_doc(doc_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a file to the WebDAV NAS and link it to the compliance document."""
    doc = db.query(models.ComplianceDocument).filter(models.ComplianceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Save the file temporarily
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Upload to NAS
        success = nas_service.upload_file(temp_path, file.filename)
        if success:
            doc.status = "Uploaded"
            doc.file_url = f"/compliance/{file.filename}"
            db.commit()
            return {"status": "success", "message": "File uploaded to NAS successfully."}
        else:
            raise HTTPException(status_code=500, detail="Failed to upload to NAS")
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

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
