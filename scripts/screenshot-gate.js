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
    
    console.log("Checking Monday-gate...");
    const response = await page.goto('https://card-bound.vercel.app/seller/onboarding/stripe', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join('/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b', 'monday_gate.png') });
    console.log("Gate loaded successfully.");

  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
