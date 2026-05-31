const Stripe = require('stripe');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    console.log("Creating temporary Stripe account to trigger webhook...");
    const account = await stripe.accounts.create({
      type: 'express',
      email: 'test_webhook_ping@trax.cards'
    });
    console.log(`Created account: ${account.id}`);
    
    console.log("Updating account metadata to trigger 'account.updated' event...");
    await stripe.accounts.update(account.id, {
      metadata: { ping: Date.now().toString() }
    });
    console.log("Update sent. Stripe is now dispatching the webhook.");

    console.log("Waiting 5 seconds for webhook delivery...");
    await new Promise(r => setTimeout(r, 5000));

    console.log("Querying webhook_events table in production DB for the delivery...");
    const events = await sql`
      SELECT id, event_type, processed_at 
      FROM webhook_events 
      WHERE event_type = 'account.updated' 
      ORDER BY processed_at DESC 
      LIMIT 1;
    `;
    
    if (events.length > 0) {
      console.log("SUCCESS! Webhook delivery confirmed in Trax DB:");
      console.log(events[0]);
    } else {
      console.log("FAIL: Webhook not found in DB.");
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
