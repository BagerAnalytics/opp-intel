import requests
from bs4 import BeautifulSoup
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}
try:
    url = "https://www.bing.com/search?q=agriculture+grants+south+africa"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    anchors = soup.select('li.b_algo h2 a')
    links = [a.get('href') for a in anchors]
    print(links)
except Exception as e:
    print(f"Error: {e}")
