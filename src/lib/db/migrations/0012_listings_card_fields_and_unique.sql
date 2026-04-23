ALTER TABLE listings ADD COLUMN IF NOT EXISTS "set" varchar(100);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS year varchar(50);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS card_number varchar(100);
ALTER TABLE listings ADD CONSTRAINT title_seller_unique UNIQUE (title, seller_id);
