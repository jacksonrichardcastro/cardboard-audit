require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer-core');
const { createClerkClient } = require('@clerk/backend');
const { execSync } = require('child_process');

// You can use standard Chrome for local testing
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3000/offers';
const USER_ID = 'user_3CyGNCve6RQR6zoPQmkKCLY1PXD';

(async () => {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  console.log("Generating test session...");
  const token = await clerk.signInTokens.createSignInToken({
    userId: USER_ID,
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

  // Manually navigate to localhost since signintoken redirects to the default url (vercel)
  console.log("Navigating to localhost offers page...");
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  // Screenshot Offers Received
  await page.screenshot({ path: 'offers_received_populated.png' });
  console.log("Saved screenshot: offers_received_populated.png");

  // Click Offers Made tab
  try {
    const tabs = await page.$$('button[role="tab"]');
    if (tabs.length > 1) {
      await tabs[1].click();
      // wait for transition
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: 'offers_made_populated.png' });
      console.log("Saved screenshot: offers_made_populated.png");
    }
  } catch (err) {
    console.log("Failed to click tab", err);
  }

  await browser.close();
})();
