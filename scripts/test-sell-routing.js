const { createClerkClient } = require('@clerk/backend');
const puppeteer = require('puppeteer');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

(async () => {
  try {
    const domain = process.argv[2] || 'http://localhost:3000';
    
    // Setup test users
    const usersList = await clerk.users.getUserList({ limit: 2 });
    const kycUserId = usersList.data[0].id;
    const nonKycUserId = usersList.data[1].id;
    
    // Ensure user 1 has approved profile
    await sql`UPDATE profiles SET application_status = 'approved', handle = 'kyc_user' WHERE user_id = ${kycUserId}`;
    // Ensure user 2 has unapproved profile
    await sql`UPDATE profiles SET application_status = 'pending', handle = 'non_kyc_user' WHERE user_id = ${nonKycUserId}`;

    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    // TEST 1: Signed-out user clicking Sell
    console.log("TEST 1: Signed-out user -> Sell button");
    let page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000 });
    await page.goto(`${domain}/sell`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sell_signed_out.png' });
    console.log("URL:", page.url());
    await page.close();

    // TEST 2: KYC-complete user -> Sell button
    console.log("TEST 2: KYC user -> Sell button");
    let token1 = await clerk.signInTokens.createSignInToken({ userId: kycUserId, expiresInSeconds: 60 });
    const context1 = await browser.createBrowserContext();
    page = await context1.newPage();
    await page.setViewport({ width: 1200, height: 1000 });
    await page.goto(`${domain}/sign-in?__clerk_ticket=${token1.token}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    await page.goto(`${domain}/sell`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sell_kyc_user.png' });
    console.log("URL:", page.url());
    await page.close();

    // TEST 3: Non-KYC user -> Sell button
    console.log("TEST 3: Non-KYC user -> Sell button");
    let token2 = await clerk.signInTokens.createSignInToken({ userId: nonKycUserId, expiresInSeconds: 60 });
    const context2 = await browser.createBrowserContext();
    page = await context2.newPage();
    await page.setViewport({ width: 1200, height: 1000 });
    await page.goto(`${domain}/sign-in?__clerk_ticket=${token2.token}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    await page.goto(`${domain}/sell`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sell_non_kyc_user.png' });
    console.log("URL:", page.url());

    // TEST 4: Non-KYC user direct to /sell/new?demo=1
    console.log("TEST 4: Non-KYC user -> /sell/new?demo=1");
    await page.goto(`${domain}/sell/new?demo=1`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sell_demo_bypass.png' });
    console.log("URL:", page.url());
    await page.close();

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
