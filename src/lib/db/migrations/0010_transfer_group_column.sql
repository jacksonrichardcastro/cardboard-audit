-- 0010_transfer_group_column.sql
-- Align the Stripe transfer_group between checkout-session creation and
-- the transfers.create call fired from lib/orders/confirm.ts.
--
-- Previously, api/stripe/checkout generated a per-session transfer group
-- string (e.g. group_<ts>_<rand>) and set it on the PaymentIntent, but
-- confirm.ts passed the PaymentIntent id as transfer_group when creating
-- the transfer. Stripe accepts both, but reconciliation (matching payout
-- transfers back to the originating charge) only works when the values
-- match. Persist the group on the order row at webhook time so the
-- confirm step reuses the exact same string.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS transfer_group_id VARCHAR(255);

-- Backfill existing PAID/later orders with the payment intent id so the
-- new column is at least populated (matches the current buggy behaviour).
-- Any order created after this migration will carry the original group.
UPDATE orders
  SET transfer_group_id = stripe_payment_intent_id
  WHERE transfer_group_id IS NULL
    AND stripe_payment_intent_id IS NOT NULL;
