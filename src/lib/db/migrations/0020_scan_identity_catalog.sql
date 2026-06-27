-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. NEW TABLES
CREATE TABLE IF NOT EXISTS card_gameplay_identities (
    id SERIAL PRIMARY KEY,
    canonical_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    attributes_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_subjects (
    id SERIAL PRIMARY KEY,
    catalog_card_id INTEGER NOT NULL,
    subject VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS card_faces (
    id SERIAL PRIMARY KEY,
    catalog_card_id INTEGER NOT NULL,
    face_index INTEGER NOT NULL,
    name VARCHAR(255),
    image_url VARCHAR(255),
    attributes_json JSONB
);

CREATE TABLE IF NOT EXISTS card_images (
    id SERIAL PRIMARY KEY,
    catalog_card_id INTEGER NOT NULL,
    parallel_id INTEGER,
    side VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL,
    embedding VECTOR,
    source VARCHAR(50) NOT NULL,
    source_ref VARCHAR(255),
    quality_score NUMERIC,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subject_aliases (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NOT NULL,
    alias_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS set_aliases (
    id SERIAL PRIMARY KEY,
    set_id INTEGER NOT NULL,
    alias VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS team_aliases (
    id SERIAL PRIMARY KEY,
    team VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS finishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS treatments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS promo_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS insert_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    set_id INTEGER
);

CREATE TABLE IF NOT EXISTS card_number_prefixes (
    id SERIAL PRIMARY KEY,
    prefix VARCHAR(50) NOT NULL,
    meaning VARCHAR(255)
);

-- 3. ADD COLUMNS (Idempotent)
DO $$ BEGIN ALTER TABLE card_sets ADD COLUMN set_code VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_sets ADD COLUMN back_copyright_line TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_sets ADD COLUMN set_symbol_image_url VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_sets ADD COLUMN card_dimensions VARCHAR(50) DEFAULT 'standard'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_sets ADD COLUMN language VARCHAR(10) DEFAULT 'en'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE catalog_cards ADD COLUMN printed_card_number VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE catalog_cards ADD COLUMN language VARCHAR(10) DEFAULT 'en'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE catalog_cards ADD COLUMN name_normalized VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE catalog_cards ADD COLUMN verification_status VARCHAR(50) DEFAULT 'unverified'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE catalog_cards ADD COLUMN source_provenance VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE catalog_cards ADD COLUMN needs_review BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE catalog_cards ADD COLUMN gameplay_identity_id INTEGER; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN finish_type VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN border_color VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN dominant_colors JSONB; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN pattern VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN is_serial_numbered BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN serial_location VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN reference_image_url VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_parallels ADD COLUMN reference_embedding VECTOR; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 4. ADD FOREIGN KEYS (Idempotent)
DO $$ BEGIN ALTER TABLE catalog_cards ADD CONSTRAINT fk_catalog_cards_gameplay_identity_id FOREIGN KEY (gameplay_identity_id) REFERENCES card_gameplay_identities(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_subjects ADD CONSTRAINT fk_card_subjects_catalog_card_id FOREIGN KEY (catalog_card_id) REFERENCES catalog_cards(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_faces ADD CONSTRAINT fk_card_faces_catalog_card_id FOREIGN KEY (catalog_card_id) REFERENCES catalog_cards(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_images ADD CONSTRAINT fk_card_images_catalog_card_id FOREIGN KEY (catalog_card_id) REFERENCES catalog_cards(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE card_images ADD CONSTRAINT fk_card_images_parallel_id FOREIGN KEY (parallel_id) REFERENCES card_parallels(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE set_aliases ADD CONSTRAINT fk_set_aliases_set_id FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE insert_programs ADD CONSTRAINT fk_insert_programs_set_id FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. INDEXES (Idempotent)
CREATE INDEX IF NOT EXISTS idx_catalog_cards_name_normalized_trgm ON catalog_cards USING GIN (name_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_card_sets_name_trgm ON card_sets USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_set_aliases_alias_trgm ON set_aliases USING GIN (alias gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_subject_aliases_alias_trgm ON subject_aliases USING GIN (alias gin_trgm_ops);
