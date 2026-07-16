from database import engine
from sqlalchemy import text

def restore_opportunities():
    with engine.begin() as conn:
        conn.execute(text("UPDATE opportunities SET status = 'open' WHERE status = 'closed'"))
        print("Restored erroneously closed opportunities to open.")

if __name__ == "__main__":
    restore_opportunities()
