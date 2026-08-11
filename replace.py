
filepath = 'backend/services/llm_service.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('gemini-1.5-flash', 'gemini-3.6-flash')
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

