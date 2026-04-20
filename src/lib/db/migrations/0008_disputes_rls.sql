-- P0-4/5: Enforcing Row Level Security dynamically for the Disputes configuration

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- 1. Buyers can read disputes they opened
CREATE POLICY "Buyer Disputes" ON disputes FOR SELECT USING (opened_by = current_setting('app.current_user_id', true));

-- 2. Sellers can read disputes bound perfectly against their sellerId in relationships
CREATE POLICY "Seller Disputes" ON disputes FOR SELECT USING (
  order_id IN (
     SELECT id FROM orders WHERE seller_id = current_setting('app.current_user_id', true)
  )
);

-- 3. System execution limits bypassing implicitly utilizing standard scopes
