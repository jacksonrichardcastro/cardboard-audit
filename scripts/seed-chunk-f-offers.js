require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    const listingRes = await sql`SELECT id, seller_id, price_cents, title FROM listings WHERE status = 'ACTIVE' LIMIT 3`;
    if (listingRes.length < 2) throw new Error("Need at least 2 listings to seed offers.");

    const usersRes = await sql`SELECT id FROM users WHERE id LIKE 'user_%' LIMIT 3`;
    if (usersRes.length < 2) throw new Error("Need at least 2 real users to seed offers.");
    
    // We'll treat users[0] as our primary tester (buyer/seller).
    const primaryUserId = usersRes[0].id;
    const secondaryUserId = usersRes[1].id;

    console.log(`Primary User ID: ${primaryUserId}`);
    console.log(`Secondary User ID: ${secondaryUserId}`);

    // 1. Offer Received by Primary User (Pending)
    // Find a listing owned by Primary User
    const primaryListingRes = await sql`SELECT id, price_cents FROM listings WHERE seller_id = ${primaryUserId} AND status = 'ACTIVE' LIMIT 1`;
    if (primaryListingRes.length > 0) {
      console.log("Inserting received offer (pending)...");
      const listPrice = primaryListingRes[0].price_cents;
      await sql`
        INSERT INTO offers (
          listing_id, buyer_id, seller_id, current_amount_cents, current_message, state, rounds_used, last_actor_id
        ) VALUES (
          ${primaryListingRes[0].id}, ${secondaryUserId}, ${primaryUserId}, ${Math.floor(listPrice * 0.8)}, 'Will you take 20% off?', 'pending', 1, ${secondaryUserId}
        )
      `;
    }

    // 2. Offer Made by Primary User (Countered by Seller)
    // Find a listing NOT owned by Primary User
    const otherListingRes = await sql`SELECT id, seller_id, price_cents FROM listings WHERE seller_id != ${primaryUserId} AND status = 'ACTIVE' LIMIT 1`;
    if (otherListingRes.length > 0) {
      console.log("Inserting made offer (countered by seller)...");
      const listPrice = otherListingRes[0].price_cents;
      const otherSeller = otherListingRes[0].seller_id;
      await sql`
        INSERT INTO offers (
          listing_id, buyer_id, seller_id, current_amount_cents, current_message, state, rounds_used, last_actor_id
        ) VALUES (
          ${otherListingRes[0].id}, ${primaryUserId}, ${otherSeller}, ${Math.floor(listPrice * 0.9)}, 'Counter offer: best I can do.', 'countered', 2, ${otherSeller}
        )
      `;
    }

    // 3. Accepted Offer
    if (otherListingRes.length > 0) {
      console.log("Inserting made offer (accepted)...");
      const listPrice = otherListingRes[0].price_cents;
      const otherSeller = otherListingRes[0].seller_id;
      await sql`
        INSERT INTO offers (
          listing_id, buyer_id, seller_id, current_amount_cents, current_message, state, rounds_used, last_actor_id
        ) VALUES (
          ${otherListingRes[0].id}, ${primaryUserId}, ${otherSeller}, ${Math.floor(listPrice * 0.95)}, 'Accepted, thanks!', 'accepted', 3, ${primaryUserId}
        )
      `;
    }

    console.log("Seeding complete. Check /offers page!");

  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await sql.end();
  }
})();
