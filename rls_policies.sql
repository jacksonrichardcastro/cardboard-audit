-- Create requesting_user_id function
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_user_id', true), ''),
    NULLIF(current_setting('request.jwt.claim.sub', true), '')
  )::text;
$$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_owner" ON users FOR SELECT USING (id = requesting_user_id());
CREATE POLICY "users_insert_service" ON users FOR INSERT WITH CHECK (false); -- service role only
CREATE POLICY "users_update_owner" ON users FOR UPDATE USING (id = requesting_user_id());
CREATE POLICY "users_delete_owner" ON users FOR DELETE USING (id = requesting_user_id());

-- profiles
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_owner" ON profiles FOR INSERT WITH CHECK (user_id = requesting_user_id());
CREATE POLICY "profiles_update_owner" ON profiles FOR UPDATE USING (user_id = requesting_user_id());
CREATE POLICY "profiles_delete_owner" ON profiles FOR DELETE USING (user_id = requesting_user_id());

-- listings
-- SELECT world-readable when status IN ('active', 'pending_marketplace_activation') OR is_demo = true, else owner-only
CREATE POLICY "listings_select" ON listings FOR SELECT USING (
  status IN ('active', 'pending_marketplace_activation') 
  OR is_demo = true 
  OR seller_id = requesting_user_id()
);
CREATE POLICY "listings_insert" ON listings FOR INSERT WITH CHECK (seller_id = requesting_user_id());
CREATE POLICY "listings_update" ON listings FOR UPDATE USING (seller_id = requesting_user_id());
CREATE POLICY "listings_delete" ON listings FOR DELETE USING (seller_id = requesting_user_id());

-- cards
-- SELECT world-readable when is_private = false, else owner-only
CREATE POLICY "cards_select" ON cards FOR SELECT USING (
  is_private = false OR owner_id = requesting_user_id()
);
CREATE POLICY "cards_insert" ON cards FOR INSERT WITH CHECK (owner_id = requesting_user_id());
CREATE POLICY "cards_update" ON cards FOR UPDATE USING (owner_id = requesting_user_id());
CREATE POLICY "cards_delete" ON cards FOR DELETE USING (owner_id = requesting_user_id());

-- offers
-- SELECT only buyer or seller
CREATE POLICY "offers_select" ON offers FOR SELECT USING (
  buyer_id = requesting_user_id() OR seller_id = requesting_user_id()
);
CREATE POLICY "offers_insert" ON offers FOR INSERT WITH CHECK (buyer_id = requesting_user_id());
-- UPDATE seller (accept/reject) or buyer (withdraw)
CREATE POLICY "offers_update" ON offers FOR UPDATE USING (
  buyer_id = requesting_user_id() OR seller_id = requesting_user_id()
);
CREATE POLICY "offers_delete" ON offers FOR DELETE USING (buyer_id = requesting_user_id());

-- item_photos
-- SELECT follows parent (listing or card) visibility. But since item_photos doesn't have a direct join, 
-- and images are usually public if the listing is, it's safer to make them public or join.
-- Let's make it world-readable for SELECT because photos are public assets anyway, 
-- and INSERT/UPDATE/DELETE owner-only? Wait, item_photos has entity_type and entity_id.
-- Let's look at item_photos schema.
