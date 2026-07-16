import os

content = ""
try:
    with open('requirements.txt', 'rb') as f:
        raw_data = f.read()
        
    # Replace null bytes (UTF-16 padding)
    clean_data = raw_data.replace(b'\x00', b'')
    # Decode as latin1 to prevent decode errors, then we can write as utf-8
    content = clean_data.decode('latin1')
    
    with open('requirements.txt', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Fixed requirements.txt encoding.")
except Exception as e:
    print(f"Error: {e}")
