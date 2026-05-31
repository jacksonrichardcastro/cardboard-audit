const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email: 'jacksonrichardcastro@gmail.com',
      capabilities: { transfers: { requested: true } }
    });
    console.log("Created account:", account.id);

    const updated = await stripe.accounts.update(account.id, {
      account_token: "tok_bypassPending"
    });
    
    console.log("Updated. details_submitted:", updated.details_submitted);
    console.log("charges_enabled:", updated.charges_enabled);
  } catch (e) {
    console.error(e);
  }
})();
