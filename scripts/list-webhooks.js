const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const endpoints = await stripe.webhookEndpoints.list();
    console.log('--- STRIPE WEBHOOKS ---');
    endpoints.data.forEach(ep => {
      console.log(`URL: ${ep.url} | Status: ${ep.status} | Id: ${ep.id}`);
      console.log(`Events: ${ep.enabled_events.join(', ')}`);
      console.log('-----------------------');
    });
  } catch (e) {
    console.error(e);
  }
})();
