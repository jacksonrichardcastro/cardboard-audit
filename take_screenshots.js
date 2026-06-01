const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // 1. Homepage (Trending + Featured dedupe, Ticker)
  await page.goto('https://card-bound-7yw95cb78-jacksonrichardcastros-projects.vercel.app', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_homepage_featured_and_trending.png', fullPage: false });

  // 2. Listing Detail Page (Listing 67 with new Title)
  await page.goto('https://card-bound-7yw95cb78-jacksonrichardcastros-projects.vercel.app/listings/67', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_listing_67_griffey.png', fullPage: false });

  // 3. Storefront (alexthegrader)
  await page.goto('https://card-bound-7yw95cb78-jacksonrichardcastros-projects.vercel.app/alexthegrader', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_storefront_preserved.png', fullPage: false });

  await browser.close();
})();
