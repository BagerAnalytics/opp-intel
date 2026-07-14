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

def run_all_scrapers():
    print("Running scheduled scrapers...")
    try:
        scrape_opportunity_desk()
        scrape_linkedin()
        print("Scrapers completed successfully.")
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

@app.post("/api/opportunities/{opp_id}/score")
def score_opportunity(opp_id: int, db: Session = Depends(get_db)):
    """Generate a match score for a specific opportunity using the LLM."""
    opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Combine deep fields for the LLM to analyze
    deep_context = f"Title: {opp.name}\n"
    if opp.description: deep_context += f"Summary: {opp.description}\n"
    if opp.eligibility_criteria: deep_context += f"Eligibility: {opp.eligibility_criteria}\n"
    if opp.selection_criteria: deep_context += f"Selection: {opp.selection_criteria}\n"
    if opp.benefits: deep_context += f"Benefits: {opp.benefits}\n"
    
    # Run the LLM Matcher
    result = generate_match_score(deep_context)
    
    # Run the Strategy Generator
    historical_context = opp.past_winners or "No past winners data available."
    strategy = generate_strategy(deep_context, historical_context)
    
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

@app.get("/api/compliance/sync")
def sync_compliance():
    """Trigger a WebDAV sync to list compliance documents."""
    docs = nas_service.list_compliance_documents()
    return {"documents_found": len(docs), "files": docs}
