import os
import csv
import re
try:
    import fitz
except ImportError:
    pass

def scan_pdfs():
    print("--- PDF Dates ---")
    date_pattern = re.compile(r'\b(?:\d{1,2}[-/thstndrd\s]*[A-Za-z]{3,10}[-/,\s]*\d{4}|\d{4}[-/]\d{2}[-/]\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b')
    for f in os.listdir('Compliance'):
        if f.endswith('.pdf'):
            try:
                doc = fitz.open(os.path.join('Compliance', f))
                text = ""
                for page in doc:
                    text += page.get_text()
                
                # find dates
                dates = date_pattern.findall(text)
                unique_dates = list(set(dates))
                print(f"File: {f}")
                print(f"Dates found: {unique_dates[:15]}")
            except Exception as e:
                print(f"Error reading {f}: {e}")

def scan_csv():
    print("\n--- CSV Contacts ---")
    important_titles = ['director', 'founder', 'ceo', 'manager', 'executive', 'partner', 'head', 'chief', 'president', 'lead', 'investor', 'vc', 'capital', 'grant', 'donor', 'fund', 'minister', 'secretary', 'board']
    
    with open('Contacts/Connections.csv', 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        for _ in range(3): next(reader) # skip headers
        headers = next(reader)
        
        total = 0
        important = 0
        for row in reader:
            if len(row) < 6: continue
            total += 1
            pos = row[5].lower()
            if any(t in pos for t in important_titles):
                important += 1
        
        print(f"Total connections: {total}")
        print(f"Important connections (filtering by title): {important}")

if __name__ == '__main__':
    scan_pdfs()
    scan_csv()
