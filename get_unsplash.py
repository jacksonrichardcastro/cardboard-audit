import urllib.request
import re

def search_unsplash(query):
    url = f"https://unsplash.com/s/photos/{query.replace(' ', '-')}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        urls = re.findall(r'https://images\.unsplash\.com/photo-[\w-]+[^"\'\s&]+', html)
        return list(set(urls))
    except Exception as e:
        print(f"Error: {e}")
        return []

print(search_unsplash("polished-gold"))
