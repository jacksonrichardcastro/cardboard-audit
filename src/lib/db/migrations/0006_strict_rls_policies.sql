-- P0-5: Full Matrix Row Level Security across all structural marketplace parameters
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- listings policies
CREATE POLICY "Public Read Access" ON listings FOR SELECT USING (status != 'DELETED');
CREATE POLICY "Seller Manage Listings" ON listings FOR ALL USING (seller_id = current_setting('app.current_user_id', true));

-- orders policies
CREATE POLICY "Buyers Scope Orders" ON orders FOR SELECT USING (buyer_id = current_setting('app.current_user_id', true));
CREATE POLICY "Sellers Scope Orders" ON orders FOR SELECT USING (seller_id = current_setting('app.current_user_id', true));

-- seller_profiles policies
CREATE POLICY "Public Read Sellers" ON seller_profiles FOR SELECT USING (true);
CREATE POLICY "Seller Self Manage" ON seller_profiles FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

-- P0-6: Audit TAMPER PROOFING
-- The audit log tracks 'actor_type' intrinsically. We mathematically deny ANY mutations.
-- Only INSERTs are allowed (which bypasses this via trigger or explicit service limits).
REVOKE UPDATE, DELETE ON audit_events FROM authenticated, anon, public;

-- service_role MUST explicitly be denied mutations to prevent webhook injection hacking 
REVOKE UPDATE, DELETE ON audit_events FROM service_role;
