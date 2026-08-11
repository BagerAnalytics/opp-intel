import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
import requests

from database import SessionLocal, engine, Base
from models import Contact, ComplianceDocument

API_URL = "https://opp-intel-production.up.railway.app"

def push_data():
    db = SessionLocal()
    
    contacts = db.query(Contact).all()
    print(f"Pushing {len(contacts)} contacts to live...")
    c_count = 0
    for c in contacts:
        data = {
            "name": c.name,
            "organization": c.organization,
            "role": c.role,
            "email": c.email,
            "linkedin_url": c.linkedin_url,
            "relationship_strength": c.relationship_strength,
            "notes": c.notes
        }
        resp = requests.post(f"{API_URL}/api/contacts", json=data)
        if resp.status_code == 200:
            c_count += 1
            
    print(f"Successfully pushed {c_count} contacts.")
    
    docs = db.query(ComplianceDocument).all()
    print(f"Pushing {len(docs)} compliance documents to live...")
    d_count = 0
    for d in docs:
        data = {
            "document_name": d.document_name,
            "status": d.status,
            "expiry_date": d.expiry_date,
            "file_url": d.file_url,
            "notes": d.notes
        }
        resp = requests.post(f"{API_URL}/api/compliance", json=data)
        if resp.status_code == 200:
            d_count += 1
            
    print(f"Successfully pushed {d_count} compliance documents.")
    db.close()

if __name__ == '__main__':
    push_data()
