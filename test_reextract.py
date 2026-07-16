import requests
import time

print("Starting request...")
start = time.time()
try:
    res = requests.post("https://confident-smile-production.up.railway.app/api/opportunities/4/re-extract") # Assuming 4 is STDF
    print(f"Status: {res.status_code}")
    print(f"Text: {res.text}")
except Exception as e:
    print(f"Error: {e}")
print(f"Took {time.time() - start} seconds")
