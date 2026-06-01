require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer-core');
const { createClerkClient } = require('@clerk/backend');
const postgres = require('postgres');

async function run() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const sql = postgres(process.env.DATABASE_URL);

  console.log("Generating test session...");
  const token = await clerk.signInTokens.createSignInToken({
    userId: 'user_3CvnSvM4NiL0XhncgIKOVbmaiKl',
    expiresInSeconds: 3600
  });

  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    defaultViewport: { width: 1280, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 1. Sign in
  console.log("Navigating to sign in token url...");
  await page.goto(token.url, { waitUntil: 'networkidle2' });

  // 2. Homepage Trending + Featured (Signed-in)
  console.log("Verifying Signed-in Homepage...");
  await page.goto('https://card-bound.vercel.app/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'verification_signed_in_homepage.png', fullPage: true });

  // 3. Storefront
  console.log("Verifying Storefront...");
  await page.goto('https://card-bound.vercel.app/sellers/alexthegrader', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'verification_storefront.png', fullPage: true });

  // 4. Admin Master Accounts Table
  console.log("Verifying Admin Dashboard...");
  await page.goto('https://card-bound.vercel.app/admin', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'verification_admin.png', fullPage: true });

  // 5. Make Offer
  console.log("Verifying Make Offer...");
  // Use listing 61 or find an active one for alex
  const listings = await sql`SELECT id FROM listings WHERE seller_id = 'seller-storefront' AND status = 'active' LIMIT 1`;
  if (listings.length > 0) {
    const listingId = listings[0].id;
    await page.goto(`https://card-bound.vercel.app/listings/${listingId}`, { waitUntil: 'networkidle2' });
    
    const makeOfferButton = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Make Offer'));
    });
    
    if (makeOfferButton) {
      await makeOfferButton.click();
      await page.waitForSelector('input[type="number"]', { timeout: 5000 });
      await page.type('input[type="number"]', '100');
      await page.type('textarea', 'Test offer via script');
      
      await page.screenshot({ path: 'verification_make_offer_modal.png' });
      
      const submitBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Send Offer'));
      });
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'verification_make_offer_success.png' });
      }
    }
  }

  // 6. Offers Sent dashboard
  console.log("Verifying Offers dashboard...");
  await page.goto('https://card-bound.vercel.app/offers', { waitUntil: 'networkidle2' });
  const tabs = await page.$$('button[role="tab"]');
  if (tabs.length > 1) {
    await tabs[1].click(); // Offers Made
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'verification_offers_sent.png' });
  }

  await browser.close();
  await sql.end();
  console.log("Done.");
}

run().catch(console.error);
