import urllib.request
import re

url = "https://www.pexels.com/search/gold%20metal%20texture/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    urls = re.findall(r'https://images\.pexels\.com/photos/\d+/pexels-photo-\d+\.jpeg', html)
    for u in list(set(urls)):
        print(u)
except Exception as e:
    print(f"Error: {e}")
