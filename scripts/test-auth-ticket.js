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
    console.log("Fetching a real user from Clerk...");
    const usersList = await clerk.users.getUserList({ limit: 1 });
    if (usersList.data.length === 0) {
      console.log("No real Clerk users found.");
      process.exit(1);
    }
    const realClerkUserId = usersList.data[0].id;
    console.log("Real Clerk User ID:", realClerkUserId);

    console.log("Ensuring this user exists in our DB to satisfy FK constraints...");
    await sql`
      INSERT INTO users (id, email) 
      VALUES (${realClerkUserId}, 'test-user@trax-internal.test')
      ON CONFLICT (id) DO NOTHING
    `;
    
    // Also create a profile so the whole user schema is happy, though view_history only checks users
    await sql`
      INSERT INTO profiles (user_id, business_name, identity_verified)
      VALUES (${realClerkUserId}, 'Test User', false)
      ON CONFLICT (user_id) DO NOTHING
    `;

    console.log("Creating sign-in token for this user...");
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: realClerkUserId,
      expiresInSeconds: 60,
    });
    
    const ticketUrl = `https://card-bound-2o51msrtp-jacksonrichardcastros-projects.vercel.app/sign-in?__clerk_ticket=${signInToken.token}`;
    console.log("Token URL:", ticketUrl);
    
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    console.log("Navigating to sign in token URL...");
    await page.goto(ticketUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Navigating to listing...");
    await page.goto('https://card-bound-2o51msrtp-jacksonrichardcastros-projects.vercel.app/listings/122', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    await browser.close();
    
    console.log("Checking viewHistory for this user...");
    const views = await sql`SELECT * FROM view_history WHERE user_id = ${realClerkUserId} ORDER BY viewed_at DESC LIMIT 1`;
    console.log("Latest view history row:");
    console.log(views);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
