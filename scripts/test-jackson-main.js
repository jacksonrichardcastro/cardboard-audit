require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer-core');
const { createClerkClient } = require('@clerk/backend');
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LISTING_URL = 'http://localhost:3000/listings/61';

(async () => {
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    
    // Find Jackson's main account ID
    console.log("Finding user ID for jacksoncastrosmacbook@gmail.com...");
    const { data: usersList } = await clerk.users.getUserList({ emailAddress: ['jacksoncastrosmacbook@gmail.com'] });
    if (usersList.length === 0) {
      throw new Error("Could not find jacksoncastrosmacbook@gmail.com in Clerk.");
    }
    const jacksonUserId = usersList[0].id;
    console.log(`Found User ID: ${jacksonUserId}`);

    console.log("Generating test session...");
    const token = await clerk.signInTokens.createSignInToken({
      userId: jacksonUserId,
      expiresInSeconds: 3600
    });

    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Navigating to sign in token url:", token.url);
    await page.goto(token.url, { waitUntil: 'networkidle2' });
    console.log("Current URL after sign in token:", page.url());

    console.log("Navigating to listing 61...");
    await page.goto(LISTING_URL, { waitUntil: 'networkidle2' });

    console.log("Clicking Make Offer...");
    const makeOfferButton = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Make Offer'));
    });
    
    if (makeOfferButton) {
      await makeOfferButton.click();
      await page.waitForSelector('input[type="number"]', { timeout: 10000 });
      console.log("Modal opened.");

      await page.type('input[type="number"]', '500');
      await page.type('textarea', 'please accept (auto-test)');

      const submitBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Send Offer'));
      });
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 2000)); // wait for action and toast
        await page.screenshot({ path: 'step2_make_offer_success.png' });
        console.log("Saved screenshot: step2_make_offer_success.png");
      }
    } else {
      console.log("Make offer button not found!");
    }

    console.log("Navigating to /offers...");
    await page.goto('http://localhost:3000/offers', { waitUntil: 'networkidle2' });
    
    // Switch to Offers Made tab
    const tabs = await page.$$('button[role="tab"]');
    if (tabs.length > 1) {
      await tabs[1].click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: 'step3_offers_made.png' });
      console.log("Saved screenshot: step3_offers_made.png");
    }

    await browser.close();

    console.log("Querying DB for auto-created user...");
    const dbUser = await sql`SELECT id, email, role FROM users WHERE id = ${jacksonUserId}`;
    console.log("DB User Row:", dbUser);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await sql.end();
  }
})();
