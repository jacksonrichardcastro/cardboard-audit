import postgres_lib from 'postgres';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = postgres_lib(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  await sql`
    CREATE OR REPLACE FUNCTION requesting_user_id()
    RETURNS text
    LANGUAGE sql STABLE
    AS $$
      SELECT COALESCE(
        NULLIF(current_setting('app.current_user_id', true), ''),
        NULLIF(current_setting('request.jwt.claim.sub', true), '')
      )::text;
    $$;
  `;

  const tables = [
    'users', 'profiles', 'seller_approval_queue', 'cards', 'listings',
    'orders', 'state_transitions', 'webhook_events', 'audit_events',
    'payouts', 'listing_reviews', 'listing_drafts', 'item_photos',
    'disputes', 'user_preferences', 'view_history', 'offers'
  ];

  for (const table of tables) {
    await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
  }

  const policies = `
    DO $$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
        END LOOP;
    END $$;

    -- users
    CREATE POLICY "users_select_owner" ON users FOR SELECT USING (id = requesting_user_id());
    CREATE POLICY "users_insert_service" ON users FOR INSERT WITH CHECK (false);
    CREATE POLICY "users_update_owner" ON users FOR UPDATE USING (id = requesting_user_id());
    CREATE POLICY "users_delete_owner" ON users FOR DELETE USING (id = requesting_user_id());

    -- profiles
    CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
    CREATE POLICY "profiles_insert_owner" ON profiles FOR INSERT WITH CHECK (user_id = requesting_user_id());
    CREATE POLICY "profiles_update_owner" ON profiles FOR UPDATE USING (user_id = requesting_user_id());
    CREATE POLICY "profiles_delete_owner" ON profiles FOR DELETE USING (user_id = requesting_user_id());

    -- listings
    CREATE POLICY "listings_select_public_or_owner" ON listings FOR SELECT USING (
      status IN ('active', 'pending_marketplace_activation') 
      OR is_demo = true 
      OR seller_id = requesting_user_id()
    );
    CREATE POLICY "listings_insert_seller" ON listings FOR INSERT WITH CHECK (seller_id = requesting_user_id());
    CREATE POLICY "listings_update_seller" ON listings FOR UPDATE USING (seller_id = requesting_user_id());
    CREATE POLICY "listings_delete_seller" ON listings FOR DELETE USING (seller_id = requesting_user_id());

    -- cards
    CREATE POLICY "cards_select_public_or_owner" ON cards FOR SELECT USING (
      is_private = false OR owner_id = requesting_user_id()
    );
    CREATE POLICY "cards_insert_owner" ON cards FOR INSERT WITH CHECK (owner_id = requesting_user_id());
    CREATE POLICY "cards_update_owner" ON cards FOR UPDATE USING (owner_id = requesting_user_id());
    CREATE POLICY "cards_delete_owner" ON cards FOR DELETE USING (owner_id = requesting_user_id());

    -- offers
    CREATE POLICY "offers_select_buyer_or_seller" ON offers FOR SELECT USING (
      buyer_id = requesting_user_id() OR seller_id = requesting_user_id()
    );
    CREATE POLICY "offers_insert_buyer" ON offers FOR INSERT WITH CHECK (buyer_id = requesting_user_id());
    CREATE POLICY "offers_update_parties" ON offers FOR UPDATE USING (
      buyer_id = requesting_user_id() OR seller_id = requesting_user_id()
    );
    CREATE POLICY "offers_delete_owner" ON offers FOR DELETE USING (buyer_id = requesting_user_id());

    -- item_photos
    CREATE POLICY "item_photos_select_public" ON item_photos FOR SELECT USING (true);
    CREATE POLICY "item_photos_insert_owner" ON item_photos FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.owner_id = requesting_user_id())
    );
    CREATE POLICY "item_photos_update_owner" ON item_photos FOR UPDATE USING (
      EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.owner_id = requesting_user_id())
    );
    CREATE POLICY "item_photos_delete_owner" ON item_photos FOR DELETE USING (
      EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.owner_id = requesting_user_id())
    );

    -- seller_approval_queue
    CREATE POLICY "saq_select_owner" ON seller_approval_queue FOR SELECT USING (seller_id = requesting_user_id());
    CREATE POLICY "saq_insert_owner" ON seller_approval_queue FOR INSERT WITH CHECK (seller_id = requesting_user_id());
    CREATE POLICY "saq_update_owner" ON seller_approval_queue FOR UPDATE USING (seller_id = requesting_user_id());
    CREATE POLICY "saq_delete_owner" ON seller_approval_queue FOR DELETE USING (seller_id = requesting_user_id());

    -- listing_drafts
    CREATE POLICY "drafts_select_owner" ON listing_drafts FOR SELECT USING (seller_id = requesting_user_id());
    CREATE POLICY "drafts_insert_owner" ON listing_drafts FOR INSERT WITH CHECK (seller_id = requesting_user_id());
    CREATE POLICY "drafts_update_owner" ON listing_drafts FOR UPDATE USING (seller_id = requesting_user_id());
    CREATE POLICY "drafts_delete_owner" ON listing_drafts FOR DELETE USING (seller_id = requesting_user_id());

    -- user_preferences
    CREATE POLICY "prefs_select_owner" ON user_preferences FOR SELECT USING (user_id = requesting_user_id());
    CREATE POLICY "prefs_insert_owner" ON user_preferences FOR INSERT WITH CHECK (user_id = requesting_user_id());
    CREATE POLICY "prefs_update_owner" ON user_preferences FOR UPDATE USING (user_id = requesting_user_id());
    CREATE POLICY "prefs_delete_owner" ON user_preferences FOR DELETE USING (user_id = requesting_user_id());

    -- view_history
    CREATE POLICY "views_select_owner" ON view_history FOR SELECT USING (user_id = requesting_user_id());
    CREATE POLICY "views_insert_owner" ON view_history FOR INSERT WITH CHECK (user_id = requesting_user_id());
    CREATE POLICY "views_update_owner" ON view_history FOR UPDATE USING (user_id = requesting_user_id());
    CREATE POLICY "views_delete_owner" ON view_history FOR DELETE USING (user_id = requesting_user_id());

    -- orders
    CREATE POLICY "orders_select_parties" ON orders FOR SELECT USING (buyer_id = requesting_user_id() OR seller_id = requesting_user_id());
    CREATE POLICY "orders_insert_none" ON orders FOR INSERT WITH CHECK (false);
    CREATE POLICY "orders_update_parties" ON orders FOR UPDATE USING (buyer_id = requesting_user_id() OR seller_id = requesting_user_id());
    CREATE POLICY "orders_delete_none" ON orders FOR DELETE USING (false);

    -- disputes
    CREATE POLICY "disputes_select_parties" ON disputes FOR SELECT USING (
      opened_by = requesting_user_id() 
      OR EXISTS (SELECT 1 FROM orders WHERE orders.id = disputes.order_id AND (orders.buyer_id = requesting_user_id() OR orders.seller_id = requesting_user_id()))
    );
    CREATE POLICY "disputes_insert_opener" ON disputes FOR INSERT WITH CHECK (opened_by = requesting_user_id());
    CREATE POLICY "disputes_update_none" ON disputes FOR UPDATE USING (false);
    CREATE POLICY "disputes_delete_none" ON disputes FOR DELETE USING (false);

    -- payouts
    CREATE POLICY "payouts_select_seller" ON payouts FOR SELECT USING (seller_id = requesting_user_id());
    CREATE POLICY "payouts_insert_none" ON payouts FOR INSERT WITH CHECK (false);
    CREATE POLICY "payouts_update_none" ON payouts FOR UPDATE USING (false);
    CREATE POLICY "payouts_delete_none" ON payouts FOR DELETE USING (false);

    -- listing_reviews
    CREATE POLICY "reviews_select_parties" ON listing_reviews FOR SELECT USING (
      reviewer_id = requesting_user_id()
      OR EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_reviews.listing_id AND listings.seller_id = requesting_user_id())
    );
    CREATE POLICY "reviews_insert_reviewer" ON listing_reviews FOR INSERT WITH CHECK (reviewer_id = requesting_user_id());
    CREATE POLICY "reviews_update_reviewer" ON listing_reviews FOR UPDATE USING (reviewer_id = requesting_user_id());
    CREATE POLICY "reviews_delete_reviewer" ON listing_reviews FOR DELETE USING (reviewer_id = requesting_user_id());

    -- state_transitions (internal append-only)
    CREATE POLICY "transitions_select_parties" ON state_transitions FOR SELECT USING (
      EXISTS (SELECT 1 FROM orders WHERE orders.id = state_transitions.order_id AND (orders.buyer_id = requesting_user_id() OR orders.seller_id = requesting_user_id()))
    );
    CREATE POLICY "transitions_insert_none" ON state_transitions FOR INSERT WITH CHECK (false);
    CREATE POLICY "transitions_update_none" ON state_transitions FOR UPDATE USING (false);
    CREATE POLICY "transitions_delete_none" ON state_transitions FOR DELETE USING (false);

    -- webhook_events
    CREATE POLICY "webhooks_select_none" ON webhook_events FOR SELECT USING (false);
    CREATE POLICY "webhooks_insert_none" ON webhook_events FOR INSERT WITH CHECK (false);
    CREATE POLICY "webhooks_update_none" ON webhook_events FOR UPDATE USING (false);
    CREATE POLICY "webhooks_delete_none" ON webhook_events FOR DELETE USING (false);

    -- audit_events
    CREATE POLICY "audit_select_none" ON audit_events FOR SELECT USING (false);
    CREATE POLICY "audit_insert_none" ON audit_events FOR INSERT WITH CHECK (false);
    CREATE POLICY "audit_update_none" ON audit_events FOR UPDATE USING (false);
    CREATE POLICY "audit_delete_none" ON audit_events FOR DELETE USING (false);
  `;
  
  await sql.unsafe(policies);
  console.log("Policies applied successfully.");
  await sql.end();
}
main().catch(console.error);
