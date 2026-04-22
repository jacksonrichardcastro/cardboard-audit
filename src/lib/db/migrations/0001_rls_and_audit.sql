-- P0-5: Enable RLS on core user tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- Allow completely public READ rules on listings since storefront depends on them
-- Originally created public policy mapped to 'status', but status column execution is pushed to 0004.
DROP POLICY IF EXISTS listings_select_public ON listings;
CREATE POLICY listings_select_public ON listings FOR SELECT USING (true);

-- Constrain Order visibility explicitly to attached Buyer or Seller IDs
CREATE POLICY orders_select_own ON orders 
  FOR SELECT USING (buyer_id = current_setting('app.current_user_id', true) OR seller_id = current_setting('app.current_user_id', true));

-- P0-6: Audit Events Append-Only constraint
-- Completely restricts MUTATIONS and DELETIONS on the table natively blocking Application-layer edits
REVOKE UPDATE, DELETE ON audit_events FROM authenticated, anon, public;

-- Allows strictly insertion logging metrics across the network
CREATE POLICY audit_insert_public ON audit_events 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY audit_select_admin ON audit_events 
  FOR SELECT USING (current_setting('app.current_user_role', true) = 'admin');
