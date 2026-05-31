require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    const user1 = 'user_3CyGNCve6RQR6zoPQmkKCLY1PXD'; // test-user@trax-internal.test
    const user2 = 'user_3EUzuoMtvk1ic1V4qF5pR3AI9E7'; // jacksonrichardcastro@gmail.com

    console.log("Re-assigning cards and listings from mock users to real Clerk users...");
    
    // Assign storefront listings to user1
    await sql`UPDATE cards SET owner_id = ${user1} WHERE owner_id = 'seller-storefront'`;
    await sql`UPDATE listings SET seller_id = ${user1} WHERE seller_id = 'seller-storefront'`;

    // Assign private listings to user2
    await sql`UPDATE cards SET owner_id = ${user2} WHERE owner_id = 'seller-private'`;
    await sql`UPDATE listings SET seller_id = ${user2} WHERE seller_id = 'seller-private'`;

    console.log("Clearing old mock offers...");
    await sql`DELETE FROM offers`;

    console.log("Seeding new offers between real users...");

    // Get a listing owned by user1
    const list1Res = await sql`SELECT id, price_cents FROM listings WHERE seller_id = ${user1} AND status = 'ACTIVE' LIMIT 1`;
    if (list1Res.length > 0) {
      console.log("Inserting received offer (pending) for user1...");
      const listPrice = list1Res[0].price_cents;
      await sql`
        INSERT INTO offers (
          listing_id, buyer_id, seller_id, current_amount_cents, current_message, state, rounds_used, last_actor_id
        ) VALUES (
          ${list1Res[0].id}, ${user2}, ${user1}, ${Math.floor(listPrice * 0.8)}, 'Will you take 20% off?', 'pending', 1, ${user2}
        )
      `;
    }

    // Get a listing owned by user2
    const list2Res = await sql`SELECT id, price_cents FROM listings WHERE seller_id = ${user2} AND status = 'ACTIVE' LIMIT 2`;
    if (list2Res.length > 0) {
      console.log("Inserting made offer (countered by seller) for user1...");
      const listPrice = list2Res[0].price_cents;
      await sql`
        INSERT INTO offers (
          listing_id, buyer_id, seller_id, current_amount_cents, current_message, state, rounds_used, last_actor_id
        ) VALUES (
          ${list2Res[0].id}, ${user1}, ${user2}, ${Math.floor(listPrice * 0.9)}, 'Counter offer: best I can do.', 'countered', 2, ${user2}
        )
      `;
    }

    if (list2Res.length > 1) {
      console.log("Inserting made offer (accepted) for user1...");
      const listPrice = list2Res[1].price_cents;
      await sql`
        INSERT INTO offers (
          listing_id, buyer_id, seller_id, current_amount_cents, current_message, state, rounds_used, last_actor_id
        ) VALUES (
          ${list2Res[1].id}, ${user1}, ${user2}, ${Math.floor(listPrice * 0.95)}, 'Accepted, thanks!', 'accepted', 3, ${user1}
        )
      `;
    }

    console.log("Seeding complete! Jackson can now verify with real accounts.");

  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await sql.end();
  }
})();
