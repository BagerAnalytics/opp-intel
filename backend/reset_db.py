from database import engine, Base
import models

# Drop all tables and recreate them to apply the new schema
print("Dropping tables...")
Base.metadata.drop_all(bind=engine)
print("Creating tables with new schema...")
Base.metadata.create_all(bind=engine)
print("Database schema successfully updated!")
