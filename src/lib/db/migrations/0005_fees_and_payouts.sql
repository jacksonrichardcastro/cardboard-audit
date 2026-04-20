-- P1-7: Add fee tier variable tracking overriding static MVP models
ALTER TABLE seller_profiles ADD COLUMN fee_tier varchar(50) NOT NULL DEFAULT 'standard';

-- P1-8: Implement payouts sub-ledger blocking lost payments entirely
CREATE TABLE payouts (
    id SERIAL PRIMARY KEY,
    seller_id varchar(255) NOT NULL REFERENCES users(id),
    order_id integer NOT NULL REFERENCES orders(id),
    stripe_transfer_id varchar(255) NOT NULL,
    gross_cents integer NOT NULL,
    fee_cents integer NOT NULL,
    net_cents integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- Protect Payout Log Immutable Integrity
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_payouts ON payouts 
  FOR SELECT USING (seller_id = current_setting('app.current_user_id', true));

REVOKE UPDATE, DELETE ON payouts FROM authenticated, anon, public;
