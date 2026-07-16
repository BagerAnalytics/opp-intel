from googlesearch import search
try:
    results = list(search('agriculture grants south africa', advanced=False, num_results=10))
    print(results)
except Exception as e:
    print(f"Error: {e}")
