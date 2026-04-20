-- P1-1: Enable RLS on disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Allow specifically the Buyer handling the dispute, or the targeted Seller receiving the dispute, to pull the record. 
-- And strictly allow Platform Admins overarching permissions.
CREATE POLICY disputes_select_own on disputes
  FOR SELECT USING (
    opened_by = current_setting('app.current_user_id', true) OR 
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = disputes.order_id 
        AND orders.seller_id = current_setting('app.current_user_id', true)
    ) OR 
    current_setting('app.current_user_role', true) = 'admin'
  );

-- Only buyers or admins can insert/open disputes manually
CREATE POLICY disputes_insert_own on disputes
  FOR INSERT WITH CHECK (
    opened_by = current_setting('app.current_user_id', true) OR 
    current_setting('app.current_user_role', true) = 'admin'
  );
