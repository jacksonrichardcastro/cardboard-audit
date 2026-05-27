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
  await page.goto('https://card-bound-git-feat-homep-5b61fc-jacksonrichardcastros-projects.vercel.app/alexthegrader', { waitUntil: 'load' });
  await page.waitForTimeout(5000); // Wait for images to load
  await page.screenshot({ path: path.join(__dirname, '../public/screenshots/buyer.png'), fullPage: false });

  console.log('Navigating to /storefront_test...');
  await page.goto('https://card-bound-git-feat-homep-5b61fc-jacksonrichardcastros-projects.vercel.app/storefront_test', { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(__dirname, '../public/screenshots/seller.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots saved!');
}

takeScreenshots().catch(console.error);
