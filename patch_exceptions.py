
import glob

scrapers = glob.glob('backend/scrapers/*.py')
for filepath in scrapers:
    if 'run_all' in filepath or 'utils' in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'validate_and_queue_link' in content:
        new_content = content.replace('except Exception as e:\n', 'except Exception as e:\n        if str(e) == \'API_QUOTA_EXCEEDED\': raise e\n')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

