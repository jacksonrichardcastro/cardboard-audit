const puppeteer = require('puppeteer');
require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/backend');
const Stripe = require('stripe');
const postgres = require('postgres');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    const email = 'jacksonrichardcastro@gmail.com';
    const password = 'TestPassword123!';

    console.log("1. Ensuring Clerk User exists");
    let userId;
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    if (users.data.length > 0) {
      userId = users.data[0].id;
    } else {
      const user = await clerk.users.createUser({
        emailAddress: [email],
        password: password,
        skipPasswordChecks: true,
      });
      userId = user.id;
    }

    console.log("2. Injecting DB Profile and Stripe Connect Account (Test Mode)");
    // Check if profile exists
    const existingProfile = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
    let accountId;
    if (existingProfile.length > 0 && existingProfile[0].stripe_connect_account_id) {
      accountId = existingProfile[0].stripe_connect_account_id;
    } else {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
      });
      accountId = account.id;

      if (existingProfile.length > 0) {
        await sql`UPDATE profiles SET stripe_connect_account_id = ${accountId} WHERE user_id = ${userId}`;
      } else {
        await sql`INSERT INTO users (id, email) VALUES (${userId}, ${email}) ON CONFLICT DO NOTHING`;
        await sql`INSERT INTO profiles (user_id, business_name, handle, display_name, kyc_status, application_status, stripe_connect_account_id) 
                  VALUES (${userId}, 'Jackson Test', 'jrc_test', 'Jackson Test', 'pending', 'approved', ${accountId})`;
      }
    }
    console.log("Stripe Connect Account ID:", accountId);

    console.log("3. Generating Account Link and completing test onboarding via Puppeteer");
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://card-bound.vercel.app/seller/settings?stripe_refresh=true',
      return_url: 'https://card-bound.vercel.app/seller/settings?stripe_success=true',
      type: 'account_onboarding',
    });

    console.log("Navigating to Stripe Test Connect UI:", accountLink.url);
    await page.goto(accountLink.url, { waitUntil: 'networkidle0' });
    
    // In Stripe test mode, there is usually a button with text "Skip this form" or we can just find it.
    await new Promise(r => setTimeout(r, 3000));
    // Take screenshot to see Stripe UI
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/stripe_connect_test.png' });
    
    const useTestPhone = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Use test phone number'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    
    if (useTestPhone) {
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submit = btns.find(b => b.innerText === 'Submit' || b.innerText === 'Continue');
        if (submit) submit.click();
      });
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Now on the next page (or if Skip was already there)
    const skipFound = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const skipBtn = btns.find(b => b.innerText.includes('Skip this form') || b.innerText.includes('Skip') || b.innerText.includes('Agree & submit'));
      if (skipBtn) {
        skipBtn.click();
        return true;
      }
      return false;
    });

    if (!skipFound) {
       console.log("Could not find Skip button. Trying to just click Agree & Submit or whatever is primary.");
       await page.evaluate(() => {
         const btn = document.querySelector('button[type="submit"], [data-testid="onboarding-submit"]');
         if (btn) btn.click();
       });
    }

    // Wait for redirect back
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log("Navigation timeout"));
    
    console.log("4. Waiting for Webhook Delivery and DB Write...");
    await new Promise(r => setTimeout(r, 5000));
    
    const updatedProfiles = await sql`SELECT kyc_status FROM profiles WHERE user_id = ${userId}`;
    console.log(`Current DB kycStatus: ${updatedProfiles[0].kyc_status}`);

    console.log("5. Generating Clerk Sign-in Token & Navigating to App");
    const token = await clerk.signInTokens.createSignInToken({ userId: userId, expiresInSeconds: 60 });
    
    // We set the cookie directly or use the token url
    // Since token URL didn't seem to work perfectly for the session in the app earlier,
    // let's try the URL first
    await page.goto(token.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("6. Navigating to /sell/new");
    await page.goto('https://card-bound.vercel.app/sell/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/seller_sell_new_e2e.png' });
    console.log("Screenshot saved!");

  } catch (e) {
    console.error("Test Failed:", e);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
