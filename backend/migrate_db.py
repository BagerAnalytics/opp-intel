import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
import models
from database import Base

def migrate():
    # 1. Ask for URLs
    print("=========================================")
    print("  RAILWAY TO SUPABASE MIGRATION SCRIPT   ")
    print("=========================================")
    print("WARNING: Make sure no one is actively using the app during migration.")
    
    old_db_url = input("\n1. Paste your OLD Railway PostgreSQL URL:\n> ").strip()
    new_db_url = input("\n2. Paste your NEW Supabase Transaction URL:\n> ").strip()
    
    if not old_db_url or not new_db_url:
        print("Error: Both URLs are required.")
        sys.exit(1)
        
    print("\n[1/4] Connecting to databases...")
    try:
        # Create engines
        old_engine = create_engine(old_db_url)
        new_engine = create_engine(new_db_url)
        
        OldSession = sessionmaker(bind=old_engine)
        NewSession = sessionmaker(bind=new_engine)
        
        old_session = OldSession()
        new_session = NewSession()
    except Exception as e:
        print(f"Failed to connect to databases: {e}")
        sys.exit(1)

    print("[2/4] Generating schema on Supabase...")
    # This creates all the tables if they don't exist
    Base.metadata.create_all(bind=new_engine)
    
    print("[3/4] Migrating data...")
    
    # List of all models to migrate
    all_models = [
        models.Opportunity,
        models.Portal,
        models.ScraperProgress,
        models.DailyStat,
        models.Contact,
        models.ComplianceDocument,
        models.User,
        models.Setting
    ]
    
    total_records = 0
    
    for model in all_models:
        table_name = model.__tablename__
        print(f"  -> Migrating {table_name}...")
        
        # Read all rows from old DB
        rows = old_session.query(model).all()
        
        count = 0
        for row in rows:
            # Detach from old session to insert into new session
            old_session.expunge(row)
            try:
                new_session.add(row)
                new_session.commit()
                count += 1
            except IntegrityError:
                # If it already exists (e.g. if script was interrupted and run again)
                new_session.rollback()
            except Exception as e:
                new_session.rollback()
                print(f"     Error migrating a row in {table_name}: {e}")
                
        print(f"     Successfully migrated {count} records in {table_name}.")
        total_records += count
        
    print("\n[4/4] MIGRATION COMPLETE!")
    print(f"Successfully moved {total_records} total records to Supabase.")
    print("=========================================")
    print("NEXT STEPS:")
    print("Update the DATABASE_URL environment variable in your backend to point to the new Supabase URL.")

if __name__ == "__main__":
    migrate()
