const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log("1. Checking Marketplace...");
    const response = await page.goto('https://card-bound.vercel.app', { waitUntil: 'networkidle0' });
    if (!response.ok()) throw new Error(`Marketplace failed: ${response.status()}`);
    await page.screenshot({ path: path.join('/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b', 'prod_marketplace.png') });
    console.log("Marketplace loaded successfully.");

    console.log("2. Checking Sign In...");
    const signInRes = await page.goto('https://card-bound.vercel.app/sign-in', { waitUntil: 'networkidle2' });
    if (!signInRes.ok()) throw new Error(`Sign in failed: ${signInRes.status()}`);
    await page.screenshot({ path: path.join('/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b', 'prod_signin.png') });
    console.log("Sign in loaded successfully.");

    console.log("3. Checking Storefront...");
    const storeRes = await page.goto('https://card-bound.vercel.app/for-you', { waitUntil: 'networkidle2' });
    if (!storeRes.ok()) throw new Error(`Storefront failed: ${storeRes.status()}`);
    await page.screenshot({ path: path.join('/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b', 'prod_storefront.png') });
    console.log("Storefront loaded successfully.");

    console.log("ALL VERIFICATIONS PASSED");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
