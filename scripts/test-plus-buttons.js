const { createClerkClient } = require('@clerk/backend');
const puppeteer = require('puppeteer');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    const domain = process.argv[2];
    if (!domain) {
      console.error("Please provide domain as argument");
      process.exit(1);
    }

    // Get a real Clerk user
    const usersList = await clerk.users.getUserList({ limit: 1 });
    const realClerkUserId = usersList.data[0].id;
    
    // Ensure they have a profile and handle
    const handle = "real_test_owner";
    await sql`UPDATE profiles SET handle = ${handle}, binder_private = false WHERE user_id = ${realClerkUserId}`;

    const token = await clerk.signInTokens.createSignInToken({ userId: realClerkUserId, expiresInSeconds: 60 });
    
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000 });
    
    console.log("Signing in as real test owner...");
    await page.goto(`${domain}/sign-in?__clerk_ticket=${token.token}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    console.log("Navigating to owner binder tab...");
    await page.goto(`${domain}/${handle}?tab=binder`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/plus_button_owner_binder.png' });
    console.log("Owner binder saved!");

    console.log("Navigating to owner storefront tab...");
    await page.goto(`${domain}/${handle}?tab=storefront`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/plus_button_owner_storefront.png' });
    console.log("Owner storefront saved!");

    console.log("Navigating to non-owner view (storefront_test)...");
    await page.goto(`${domain}/storefront_test?tab=binder`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/plus_button_non_owner.png' });
    console.log("Non-owner saved!");

    await page.close();
    await browser.close();
    console.log("All screenshots saved successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
