-- 0011_hot_path_indexes.sql
-- Targeted indexes for the three query patterns that drive production load.
-- Each index is paired with the exact SQL it's meant to accelerate so
-- future reviewers can see what the index is for and drop it if the query
-- pattern is ever refactored away.
--
-- We use CREATE INDEX IF NOT EXISTS (not CONCURRENTLY) because the CI
-- migration runner executes each file inside an implicit transaction and
-- CONCURRENTLY can't be run there. Cardbound has not yet gone to prod, so
-- the non-concurrent lock is acceptable. When we later re-issue any of
-- these to drop+recreate on a live table, do it by hand with CONCURRENTLY.

-- =========================================================================
-- 1. state_transitions: tracking-number reverse lookup used by the Shippo
-- webhook to map an incoming tracking event to the order it shipped on:
--
--   SELECT order_id
--     FROM state_transitions
--     WHERE tracking_number = $1
--     ORDER BY created_at DESC
--     LIMIT 1
--
-- The existing tracking_idx (tracking_number alone) already made the
-- lookup fast, but the ORDER BY created_at DESC still required an
-- in-memory sort. A composite on (tracking_number, created_at DESC) lets
-- Postgres walk the index in reverse and stop at LIMIT 1.
-- =========================================================================
CREATE INDEX IF NOT EXISTS state_transitions_tracking_recent_idx
  ON state_transitions (tracking_number, created_at DESC);

-- =========================================================================
-- 2. orders: payout sweeper (api/cron/payout-sweeper) runs every 5 min and
-- scans for orders that went PENDING_BUYER_CONFIRM more than 72h ago:
--
--   SELECT id FROM orders
--     WHERE current_state = 'PENDING_BUYER_CONFIRM'
--       AND delivered_at < NOW() - INTERVAL '72 hours'
--     ORDER BY delivered_at
--     LIMIT 50
--
-- Without this index the sweeper seq-scans the entire orders table every
-- cron tick — fine at MVP volume, catastrophic at scale. Partial index
-- keyed on the pending state keeps it tiny (confirmed/refunded rows are
-- not indexed at all).
-- =========================================================================
CREATE INDEX IF NOT EXISTS orders_pending_confirm_delivered_idx
  ON orders (delivered_at)
  WHERE current_state = 'PENDING_BUYER_CONFIRM';

-- =========================================================================
-- 3. orders: buyer dashboard loads a user's order history newest-first:
--
--   SELECT ... FROM orders
--     WHERE buyer_id = $1
--     ORDER BY created_at DESC
--
-- We already have buyer_order_idx on (buyer_id) which handles the filter.
-- Adding created_at DESC as the trailing column removes the in-memory
-- sort and caps the dashboard page load even for power-user accounts with
-- hundreds of orders. We keep the original single-col index in place for
-- now; DROP it in a later migration if pg_stat_user_indexes shows zero use.
-- =========================================================================
CREATE INDEX IF NOT EXISTS orders_buyer_created_idx
  ON orders (buyer_id, created_at DESC);
