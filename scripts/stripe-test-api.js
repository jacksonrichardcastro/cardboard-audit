const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'jacksonrichardcastro@gmail.com',
      capabilities: {
        transfers: {requested: true},
      },
    });
    console.log("Created account:", account.id);

    // Try to update with charges_enabled=true (might throw error)
    // Actually, in test mode, you can sometimes pass specific values
    const updated = await stripe.accounts.update(account.id, {
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '8.8.8.8'
      },
      business_profile: {
        url: 'https://card-bound.vercel.app'
      }
    });
    console.log("Updated account. charges_enabled:", updated.charges_enabled);
  } catch (e) {
    console.error(e.message);
  }
})();
