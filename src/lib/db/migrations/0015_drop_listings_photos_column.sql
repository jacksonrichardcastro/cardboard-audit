INSERT INTO listing_photos (listing_id, kind, sort_order, storage_path, created_at) SELECT id, CASE WHEN ord.idx = 1 THEN 'front' ELSE 'angle' END, ord.idx - 1, ord.url, NOW() FROM listings, json_array_elements_text(listings.photos) WITH ORDINALITY AS ord(url, idx) WHERE listings.photos IS NOT NULL;
ALTER TABLE listings DROP COLUMN photos;
