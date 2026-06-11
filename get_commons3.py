import urllib.request
import json

def get_images(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read()
        data = json.loads(html)
        for page_id, page_info in data.get('query', {}).get('pages', {}).items():
            if 'imageinfo' in page_info:
                print(page_info['imageinfo'][0]['url'])
    except Exception as e:
        print(f"Error: {e}")

print("SEARCHING: brushed gold texture")
get_images("brushed gold texture")
print("SEARCHING: polished brass texture macro")
get_images("polished brass texture macro")
