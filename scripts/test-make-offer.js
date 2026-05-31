require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const path = require('path');
const postgres = require('postgres');
const { createClerkClient } = require('@clerk/backend');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = postgres(process.env.DATABASE_URL);

async function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Pick a valid listing ID to test on.
    const listingRes = await sql`SELECT id, price_cents, title FROM listings WHERE status = 'ACTIVE' LIMIT 1`;
    if (listingRes.length === 0) throw new Error("No active listings found.");
    const listing = listingRes[0];
    console.log(`Testing Make Offer on listing ${listing.id} (${listing.title})`);
    
    const targetUrl = `https://card-bound.vercel.app/listings/${listing.id}`;

    // STEP 1: Signed-out load
    console.log("Loading signed-out state...");
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    
    // Click Make Offer (should trigger Clerk sign-in modal)
    console.log("Clicking Make Offer while signed out...");
    const buttons = await page.$$('button');
    let makeOfferBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Make Offer')) {
        makeOfferBtn = btn;
        break;
      }
    }
    
    if (makeOfferBtn) {
      await makeOfferBtn.click();
      await delay(2000); // Wait for Clerk modal
await page.screenshot({ path: path.join('/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b', 'e2e_modal_signin.png') });
      console.log("Saved screenshot: e2e_modal_signin.png");
    } else {
      console.warn("Make Offer button not found on signed-out state!");
    }

    // STEP 2: Authenticate programmatically to bypass captchas
    console.log("Generating test session...");
    // Find a real Clerk user (id usually starts with user_)
    const users = await sql`SELECT id FROM users WHERE id LIKE 'user_%' LIMIT 1`;
    if (users.length === 0) throw new Error("No real Clerk users found in DB.");
    const testUserId = users[0].id;
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: testUserId,
      expiresInSeconds: 60 * 60,
    });
    // Use the sign-in token URL to authenticate the browser session
    console.log("Navigating to sign in token url:", signInToken.url);
    await page.goto(signInToken.url, { waitUntil: 'networkidle0' });
    
    // Check if we are still on clerk page or not
    console.log("Current URL after sign in token:", page.url());
    
    // After sign-in, redirect back to the listing page
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    console.log("Authenticated as user:", testUserId);
    console.log("Current URL after redirect:", page.url());

    // STEP 3: Click Make Offer again (now signed in)
    console.log("Clicking Make Offer while signed in...");
    const buttonsIn = await page.$$('button');
    let makeOfferBtnIn = null;
    for (const btn of buttonsIn) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Make Offer')) {
        makeOfferBtnIn = btn;
        break;
      }
    }
    
    if (makeOfferBtnIn) {
      await makeOfferBtnIn.click();
      await delay(1000);
      await page.screenshot({ path: path.join('/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b', 'e2e_offer_modal.png') });
      console.log("Saved screenshot: e2e_offer_modal.png");
      
      // Submit an offer
      console.log("Submitting offer...");
      const offerAmount = Math.floor(listing.price_cents / 100) - 1; // 1 dollar less
      await page.waitForSelector('input[type="number"]', { visible: true });
      await page.type('input[type="number"]', offerAmount.toString());
      await page.type('textarea', "This is a test offer.");
      
      // Click Send Offer
      const dialogButtons = await page.$$('button');
      for (const btn of dialogButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Send Offer')) {
          await btn.click();
          break;
        }
      }
      
      // Wait for toast
      await delay(1500);
      await page.screenshot({ path: path.join('/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b', 'e2e_offer_toast.png') });
      console.log("Saved screenshot: e2e_offer_toast.png");
    }

    // STEP 4: Query DB for the row
    console.log("Querying database for the new offer...");
    const offerRes = await sql`SELECT * FROM offers ORDER BY created_at DESC LIMIT 1`;
    console.log("DATABASE ROW CREATED:");
    console.log(JSON.stringify(offerRes[0], null, 2));

  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await browser.close();
    await sql.end();
  }
})();
