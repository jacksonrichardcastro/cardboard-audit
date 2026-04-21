-- 0009_system_actor_and_update_policies.sql
-- P0 CI fix: Adds missing UPDATE/INSERT policies on orders, and "system" actor policies
-- across RLS-enabled tables so cron jobs, webhook handlers, and test fixtures can operate.
--
-- The "system" actor is set via withUserContext("system", ...) from trusted server code
-- only (cron jobs, webhooks, test setup). Since app.current_user_id is a SET LOCAL
-- transaction-scoped setting, it cannot be reached by user-submitted requests.
--
-- All policies are additive (OR combined with existing policies) so this does not
-- weaken existing buyer/seller isolation — buyers still only see their own orders.

-- ===== ORDERS =====

-- Missing: UPDATE policies. Without these, buyer/seller cannot update their own orders.
CREATE POLICY "Buyers Update Own Orders" ON orders
  FOR UPDATE
  USING (buyer_id = current_setting('app.current_user_id', true))
  WITH CHECK (buyer_id = current_setting('app.current_user_id', true));

CREATE POLICY "Sellers Update Own Orders" ON orders
  FOR UPDATE
  USING (seller_id = current_setting('app.current_user_id', true))
  WITH CHECK (seller_id = current_setting('app.current_user_id', true));

-- Missing: INSERT policy. Buyer creates order during checkout.
CREATE POLICY "Buyers Create Own Orders" ON orders
  FOR INSERT
  WITH CHECK (buyer_id = current_setting('app.current_user_id', true));

-- System actor full access on orders (cron sweeper auto-confirms, webhook handlers transition state)
CREATE POLICY "System Actor Orders" ON orders
  FOR ALL
  USING (current_setting('app.current_user_id', true) = 'system')
  WITH CHECK (current_setting('app.current_user_id', true) = 'system');

-- ===== LISTINGS =====

-- System actor full access on listings (admin/fixture loading)
CREATE POLICY "System Actor Listings" ON listings
  FOR ALL
  USING (current_setting('app.current_user_id', true) = 'system')
  WITH CHECK (current_setting('app.current_user_id', true) = 'system');

-- ===== SELLERS =====

-- System actor full access on sellers (onboarding webhooks, admin approvals)
CREATE POLICY "System Actor Sellers" ON sellers
  FOR ALL
  USING (current_setting('app.current_user_id', true) = 'system')
  WITH CHECK (current_setting('app.current_user_id', true) = 'system');

-- ===== DISPUTES =====

-- System actor full access on disputes (admin resolution, escalation)
CREATE POLICY "System Actor Disputes" ON disputes
  FOR ALL
  USING (current_setting('app.current_user_id', true) = 'system')
  WITH CHECK (current_setting('app.current_user_id', true) = 'system');
