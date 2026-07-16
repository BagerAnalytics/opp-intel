from duckduckgo_search import DDGS
print("Testing BING backend:")
try:
    with DDGS() as ddgs:
        results = ddgs.text("agriculture grants south africa", max_results=2, backend="bing")
        print(results)
except Exception as e:
    print(e)

print("\nTesting LITE backend:")
try:
    with DDGS() as ddgs:
        results = ddgs.text("agriculture grants south africa", max_results=2, backend="lite")
        print(results)
except Exception as e:
    print(e)
