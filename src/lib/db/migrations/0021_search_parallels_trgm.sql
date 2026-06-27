-- Create trigram GIN index on parallels for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_card_parallels_name_trgm ON card_parallels USING GIN (name gin_trgm_ops);
