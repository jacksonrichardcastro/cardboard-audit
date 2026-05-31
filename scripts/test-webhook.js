// fetch is native
require('dotenv').config({ path: '.env.local' });

(async () => {
  try {
    const webhookId = 'we_1TdCewEJZoMnxHFC4WLWDd0n';
    const secretKey = process.env.STRIPE_SECRET_KEY;

    // Send a test event (e.g. account.updated or just let it send a default)
    // The user suggested POST /v1/webhook_endpoints/{id}/test
    const url = `https://api.stripe.com/v1/webhook_endpoints/${webhookId}/test`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      }
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(data, null, 2));

  } catch (e) {
    console.error(e);
  }
})();
