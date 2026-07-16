from playwright.sync_api import sync_playwright
import time
import requests

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        api_url = None
        
        def handle_response(response):
            nonlocal api_url
            if "api/opportunities" in response.url and response.request.method == "GET":
                if not api_url:
                    api_url = response.url.split("/api/opportunities")[0]
                    print(f"Found API URL: {api_url}")
        
        page.on("response", handle_response)
        
        print("Visiting frontend...")
        page.goto("https://adorable-optimism-production-58be.up.railway.app/")
        
        # Wait a bit for requests to settle
        time.sleep(5)
        
        if api_url:
            print("Fetching all opportunities to delete mocks...")
            try:
                opps = requests.get(f"{api_url}/api/opportunities").json()
                for opp in opps:
                    if opp.get("link") and "mock_etender" in opp.get("link"):
                        print(f"Deleting mock opportunity {opp['id']}...")
                        requests.delete(f"{api_url}/api/opportunities/{opp['id']}")
                print("Done deleting mocks!")
            except Exception as e:
                print("Error deleting:", e)
        else:
            print("Could not find API URL")
            
        browser.close()

if __name__ == "__main__":
    run()
