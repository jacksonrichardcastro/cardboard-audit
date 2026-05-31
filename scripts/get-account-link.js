const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: 'acct_1TdDQcCycNnfp2Cv',
      refresh_url: 'https://card-bound.vercel.app/seller/settings?stripe_refresh=true',
      return_url: 'https://card-bound.vercel.app/seller/settings?stripe_success=true',
      type: 'account_onboarding',
    });
    console.log("ACCOUNT LINK:", accountLink.url);
  } catch (e) {
    console.error(e);
  }
})();
