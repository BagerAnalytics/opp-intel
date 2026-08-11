
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from backend.database import SessionLocal
from backend import models
from datetime import datetime

new_portals = [
    {'name': 'Startup Researcher', 'url': 'https://www.startupresearcher.com/opportunity-radar?page=1'},
    {'name': 'Start Hub Ops SA', 'url': 'https://starthubops.co.za/'},
    {'name': 'Standards Facility', 'url': 'https://www.standardsfacility.org/project/apply'},
    {'name': 'Unconnected ConnectFunding', 'url': 'https://unconnected.org/connectfunding'},
    {'name': 'Agriventures Funding Preview', 'url': 'https://agriventures.co/dashboard/funding-preview'}
]

db = SessionLocal()
added = 0
try:
    for p in new_portals:
        existing = db.query(models.Portal).filter(models.Portal.url == p['url']).first()
        if not existing:
            new_p = models.Portal(
                name=p['name'],
                url=p['url'],
                status='Active',
                opportunities_found=0,
                last_scraped=datetime.now().strftime('%Y-%m-%d %H:%M')
            )
            db.add(new_p)
            added += 1
    db.commit()
    print(f'Successfully added {added} new portals to the database.')
except Exception as e:
    print(f'Error: {e}')
finally:
    db.close()

