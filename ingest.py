import sys
import os
import shutil
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
import csv

from database import SessionLocal, engine, Base
from models import Contact, ComplianceDocument

# Make sure tables exist
Base.metadata.create_all(bind=engine)

def import_contacts():
    db = SessionLocal()
    important_titles = ['director', 'founder', 'ceo', 'manager', 'executive', 'partner', 'head', 'chief', 'president', 'lead', 'investor', 'vc', 'capital', 'grant', 'donor', 'fund', 'minister', 'secretary', 'board']
    
    with open('Contacts/Connections.csv', 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        for _ in range(3): next(reader)
        headers = next(reader)
        
        imported = 0
        for row in reader:
            if len(row) < 6: continue
            fname = row[0].strip()
            lname = row[1].strip()
            url = row[2].strip()
            email = row[3].strip()
            company = row[4].strip()
            pos = row[5].strip()
            
            if not fname and not lname: continue
            
            if any(t in pos.lower() for t in important_titles):
                # Check if exists
                exists = db.query(Contact).filter(Contact.linkedin_url == url).first() if url else False
                if not exists:
                    contact = Contact(
                        name=f"{fname} {lname}".strip(),
                        organization=company,
                        role=pos,
                        email=email if email else None,
                        linkedin_url=url if url else None,
                        relationship_strength="Cold"
                    )
                    db.add(contact)
                    imported += 1
    
    db.commit()
    print(f"Successfully imported {imported} important contacts to the database.")
    db.close()

def import_compliance():
    db = SessionLocal()
    
    # Hardcoded/Guessed Expiry Dates based on PDF scan
    expirations = {
        "BEE Affidavit (2).pdf": "2025-08-30", # Best guess, usually 1 year
        "CSD REGISTRATION SUMMARY REPORT.pdf": "2026-08-28",
        "FPM20-PRPACC-183_-_Accreditation_Report.pdf": "2026-06-30",
        "Premier Agric Company Registration.pdf": "None",
        "Premier Agric Pty Ltd AgriSETA Accreditation 2026.pdf": "2026-06-30",
        "Premier Agric Pty Ltd AgriSeta Accreditation July 2026.pdf": "2026-07-08",
        "Premier Agric Tax Clearance Certificate.pdf": "2027-03-07"
    }
    
    # create public folder if it doesn't exist
    os.makedirs('frontend/public/compliance', exist_ok=True)
    
    imported = 0
    for file in os.listdir('Compliance'):
        if file.endswith('.pdf'):
            # Copy file to frontend public directory
            src = os.path.join('Compliance', file)
            dest = os.path.join('frontend/public/compliance', file)
            shutil.copy(src, dest)
            
            expiry = expirations.get(file, "Unknown")
            
            # Check if exists
            exists = db.query(ComplianceDocument).filter(ComplianceDocument.document_name == file).first()
            if not exists:
                doc = ComplianceDocument(
                    document_name=file,
                    status="Uploaded",
                    expiry_date=expiry,
                    file_url=f"/compliance/{file}"
                )
                db.add(doc)
                imported += 1
    
    db.commit()
    print(f"Successfully imported {imported} compliance documents to the database.")
    db.close()

if __name__ == '__main__':
    import_contacts()
    import_compliance()
