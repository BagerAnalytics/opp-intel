import subprocess
import sys

print("Testing playwright scraper directly...")
try:
    result = subprocess.run(
        [sys.executable, "scrapers/generic_scraper.py", "https://example.com"],
        capture_output=True,
        text=True,
        timeout=10
    )
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except Exception as e:
    print("ERROR:", e)
