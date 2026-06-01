require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer-core');
const { createClerkClient } = require('@clerk/backend');

async function run() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  console.log("Generating test session...");
  const token = await clerk.signInTokens.createSignInToken({
    userId: 'user_3CvnSvM4NiL0XhncgIKOVbmaiKl',
    expiresInSeconds: 3600
  });

  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  console.log("Navigating to sign in token url:", token.url);
  await page.goto(token.url, { waitUntil: 'networkidle2' });

  console.log("Current URL after sign in token:", page.url());
  
  await page.goto('https://card-bound.vercel.app/for-you', { waitUntil: 'networkidle2' });
  console.log("For You URL:", page.url());
  
  const title = await page.title();
  console.log("Page Title:", title);
  
  const content = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log("Page Content Snippet:", content);
  
  await page.screenshot({ path: 'foryou_signed_in_vercel.png', fullPage: true });
  console.log("Screenshot saved to foryou_signed_in_vercel.png");
  
  await browser.close();
}

run().catch(console.error);
