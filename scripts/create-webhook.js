const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const endpoint = await stripe.webhookEndpoints.create({
      url: 'https://card-bound.vercel.app/api/webhooks/stripe',
      enabled_events: [
        'account.updated',
        'account.application.deauthorized',
        'checkout.session.completed',
        'identity.verification_session.verified'
      ],
      description: 'Trax production',
    });
    
    console.log(`WEBHOOK_ID: ${endpoint.id}`);
    console.log(`WEBHOOK_SECRET: ${endpoint.secret}`);
  } catch (e) {
    console.error(e);
  }
})();
