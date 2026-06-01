const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  // 1. Homepage screenshots
  await page.goto('https://card-bound-4e45420g7-jacksonrichardcastros-projects.vercel.app', { waitUntil: 'networkidle2' });
  
  // Wait a moment for images to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Screenshot whole homepage to show Beta Pill, Trending, and Featured
  await page.screenshot({ path: 'screenshot_homepage_beta_trending_featured.png', fullPage: true });

  // 2. Storefront screenshots
  await page.goto('https://card-bound-4e45420g7-jacksonrichardcastros-projects.vercel.app/alexthegrader', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Screenshot storefront to show Header Strip (Slot 3 fixed) and Binder grid (116)
  await page.screenshot({ path: 'screenshot_storefront_header_and_grid.png', fullPage: true });

  await browser.close();
})();
