const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // 1. Homepage (Trending + Featured dedupe, Ticker)
  await page.goto('https://card-bound-6g9ykuaim-jacksonrichardcastros-projects.vercel.app', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_homepage_deduped.png', fullPage: false });

  // 2. Listing Detail Page (Seller Card clickability and Member since date)
  await page.goto('https://card-bound-6g9ykuaim-jacksonrichardcastros-projects.vercel.app/listings/104', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_listing_seller_card.png', fullPage: false });

  // 3. Storefront (alexthegrader)
  await page.goto('https://card-bound-6g9ykuaim-jacksonrichardcastros-projects.vercel.app/alexthegrader', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_storefront_alexthegrader.png', fullPage: false });

  await browser.close();
})();
