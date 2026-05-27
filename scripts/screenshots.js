const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  console.log('Starting Playwright...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to /alexthegrader...');
  await page.goto('http://localhost:3000/alexthegrader', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for images to load
  await page.screenshot({ path: path.join(__dirname, '../public/screenshots/buyer.png'), fullPage: false });

  console.log('Navigating to /storefront_test...');
  await page.goto('http://localhost:3000/storefront_test', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, '../public/screenshots/seller.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots saved!');
}

takeScreenshots().catch(console.error);
