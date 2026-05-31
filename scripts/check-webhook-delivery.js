const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    console.log("Fetching all recent events...");
    const events = await stripe.events.list({
      limit: 5
    });

    events.data.forEach(ev => {
      console.log(`Event ID: ${ev.id} | Type: ${ev.type} | Pending Webhooks: ${ev.pending_webhooks}`);
    });
  } catch (e) {
    console.error(e);
  }
})();
