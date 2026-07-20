import psycopg2
conn = psycopg2.connect('postgresql://postgres:CMyyRovzZntXNnCrdYxOevbFvVbUIPXl@junction.proxy.rlwy.net:16208/railway')
cur = conn.cursor()
cur.execute("UPDATE scraper_progress SET updated_at = '2000-01-01 00:00:00', is_active = False WHERE id=1;")
conn.commit()
print('unlocked')
