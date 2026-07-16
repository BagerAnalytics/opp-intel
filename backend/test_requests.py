import requests
from bs4 import BeautifulSoup
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
try:
    url = "https://html.duckduckgo.com/html/?q=agriculture+grants+south+africa"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    anchors = soup.select('a.result__url')
    links = [a.get('href') for a in anchors]
    print(links)
except Exception as e:
    print(f"Error: {e}")
