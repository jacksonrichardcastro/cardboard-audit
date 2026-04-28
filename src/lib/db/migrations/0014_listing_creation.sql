ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS edition VARCHAR(100),
  ADD COLUMN IF NOT EXISTS graded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS listing_photos (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL, -- front, back, angle
  sort_order INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  captured_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_photos_listing_id ON listing_photos(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_photos_listing_id_sort ON listing_photos(listing_id, sort_order);

CREATE TABLE IF NOT EXISTS listing_reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id VARCHAR(255) NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- approved, rejected, changes_requested
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_reviews_listing_id ON listing_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_reviews_reviewer_id ON listing_reviews(reviewer_id);

CREATE TABLE IF NOT EXISTS listing_drafts (
  id SERIAL PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_drafts_seller_id ON listing_drafts(seller_id);
