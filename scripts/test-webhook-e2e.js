const Stripe = require('stripe');
const postgres = require('postgres');

(async () => {
  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123');
    const secret = 'whsec_3wyKsYWps0ccDfyrPW8rmBLpjFHHXD1v';
    
    const eventId = `evt_test_${Date.now()}`;
    const payload = JSON.stringify({
      id: eventId,
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_123456789',
          details_submitted: true,
          charges_enabled: true
        }
      }
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });

    console.log("Sending signed payload to production webhook endpoint...");
    const response = await fetch('https://card-bound.vercel.app/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    });

    console.log("Response Status:", response.status);
    const responseText = await response.text();
    console.log("Response Body:", responseText || "<empty>");
    
    if (response.status === 200) {
      console.log("SUCCESS: Webhook processed payload and returned 200.");
    } else {
      console.log("FAIL: Webhook returned non-200.");
    }
  } catch (e) {
    console.error(e);
  }
})();
