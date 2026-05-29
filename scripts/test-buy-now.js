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
    
    // We will test on localhost so we don't have to wait for Vercel
    const ticketUrl = `https://card-bound-flnx7499k-jacksonrichardcastros-projects.vercel.app/sign-in?__clerk_ticket=${signInToken.token}`;
    
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    console.log("Navigating to local URL...");
    await page.goto(ticketUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Navigating to listing...");
    await page.goto('https://card-bound-flnx7499k-jacksonrichardcastros-projects.vercel.app/listings/122', { waitUntil: 'networkidle0' });
    
    console.log("Clicking Buy Now...");
    // Find the first visible Buy Now button (there's desktop and mobile)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const buyBtn = btns.find(b => b.textContent.includes('Buy Now'));
      if(buyBtn) buyBtn.click();
    });
    
    console.log("Waiting for modal...");
    await page.waitForSelector('.sm\\:max-w-md', { visible: true, timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000)); // wait for animation
    
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/buy_now_modal_screenshot.png' });
    console.log("Modal screenshot saved!");
    
    console.log("Clicking Confirm Purchase...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.textContent.includes('Confirm Purchase'));
      if(confirmBtn) confirmBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 3000));
    const url = page.url();
    console.log("Navigated to:", url);
    if (url.includes('checkout.stripe.com')) {
      console.log("Stripe redirect successful!");
    } else {
      console.log("Did not redirect to Stripe. Current URL:", url);
    }
    
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
