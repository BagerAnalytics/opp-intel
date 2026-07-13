import pandas as pd
import sys
import os

# Add parent directory to path to import database and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import engine, SessionLocal, Base
from models import Opportunity

def init_db():
    Base.metadata.create_all(bind=engine)

def import_csvs(file_paths):
    db = SessionLocal()
    for file_path in file_paths:
        try:
            print(f"Reading {file_path}...")
            # CSVs are semicolon separated based on our previous check
            df = pd.read_csv(file_path, sep=';', encoding='cp1252')
            
            for index, row in df.iterrows():
                # Basic NaN handling
                def safe_str(val):
                    return str(val) if pd.notna(val) else None

                opp = Opportunity(
                    name=safe_str(row.get('Name of Application')),
                    description=safe_str(row.get('Description')),
                    link=safe_str(row.get('Link')),
                    requirements=safe_str(row.get('Requirements')),
                    opening_date=safe_str(row.get('Opening Date')),
                    closing_date=safe_str(row.get('Closing Date')),
                    applied=safe_str(row.get('Applied?')),
                    outcome=safe_str(row.get('Application Outcome')),
                    feedback_notes=safe_str(row.get('Feedback Notes')),
                    notes_when_applying=safe_str(row.get('Notes When Applying')),
                    prize_amount=safe_str(row.get('Prize / Funding Amount')),
                    source="CSV_Import"
                )
                db.add(opp)
            db.commit()
            print(f"Successfully imported {len(df)} records from {file_path}")
        except Exception as e:
            print(f"Failed to process {file_path}: {e}")
            db.rollback()
    
    db.close()

if __name__ == "__main__":
    init_db()
    csv_files = [
        r"C:\Users\mngad\Downloads\PREMIER MEMORY\Application_Tracker_v12 (2).csv",
        r"C:\Users\mngad\Downloads\PREMIER MEMORY\Application_Tracker_v12 (3).csv",
        r"C:\Users\mngad\Downloads\PREMIER MEMORY\Application_Tracker_v12 (4).csv"
    ]
    import_csvs(csv_files)
