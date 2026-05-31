const { createClerkClient } = require('@clerk/backend');
const puppeteer = require('puppeteer');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

(async () => {
  try {
    const usersList = await clerk.users.getUserList({ limit: 1 });
    const realClerkUserId = usersList.data[0].id;

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: realClerkUserId,
      expiresInSeconds: 60,
    });
    
    const domain = process.argv[2];
    if (!domain) {
      console.error("Please provide domain as argument");
      process.exit(1);
    }
    const ticketUrl = `${domain}/sign-in?__clerk_ticket=${signInToken.token}`;
    
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    // Set larger viewport to see everything
    await page.setViewport({ width: 1200, height: 1000 });
    
    console.log("Navigating to sign in...");
    await page.goto(ticketUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Testing NON-DEMO route (should redirect)...");
    const res1 = await page.goto(`${domain}/sell/new`, { waitUntil: 'networkidle0' });
    const currentUrl1 = page.url();
    if (currentUrl1.includes('/seller/become')) {
      console.log("SUCCESS: Non-demo user correctly redirected to /seller/become");
    } else {
      console.log("FAILED: Non-demo user was NOT redirected! URL:", currentUrl1);
    }

    console.log("Testing DEMO route (should load listing creation UI)...");
    const res2 = await page.goto(`${domain}/sell/new?demo=1`, { waitUntil: 'networkidle0' });
    const currentUrl2 = page.url();
    if (currentUrl2.includes('/sell/new')) {
      console.log("SUCCESS: Demo mode successfully loaded without redirect");
    } else {
      console.log("FAILED: Demo mode redirected! URL:", currentUrl2);
    }
    
    console.log("Waiting for UI components to render...");
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/demo_mode_ui_screenshot.png' });
    console.log("Listing creation UI screenshot saved!");
    
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
