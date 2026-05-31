require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    const listingRes = await sql`SELECT id, seller_id, price_cents FROM listings WHERE status = 'ACTIVE' LIMIT 1`;
    const listing = listingRes[0];

    const usersRes = await sql`SELECT id FROM users WHERE id LIKE 'user_%' LIMIT 1`;
    const buyerId = usersRes[0].id;

    const offerAmount = Math.floor(listing.price_cents / 100) - 1;

    console.log("Inserting test offer...");
    const inserted = await sql`
      INSERT INTO offers (
        listing_id, buyer_id, seller_id, current_amount_cents, current_message, state, rounds_used, last_actor_id
      ) VALUES (
        ${listing.id}, ${buyerId}, ${listing.seller_id}, ${offerAmount * 100}, 'Manual verification offer', 'pending', 1, ${buyerId}
      )
      RETURNING *
    `;

    console.log(JSON.stringify(inserted[0], null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
})();
