
import glob
for filepath in glob.glob('backend/scrapers/*.py'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    while 'if str(e) == \'API_QUOTA_EXCEEDED\': raise e\n        if str(e)' in content:
        content = content.replace('if str(e) == \'API_QUOTA_EXCEEDED\': raise e\n        if str(e) == \'API_QUOTA_EXCEEDED\': raise e', 'if str(e) == \'API_QUOTA_EXCEEDED\': raise e')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

