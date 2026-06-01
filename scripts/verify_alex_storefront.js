const puppeteer = require('puppeteer-core');

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    defaultViewport: { width: 1280, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 1. Homepage Trending + Featured
  console.log("Verifying Anonymous Homepage...");
  await page.goto('https://card-bound.vercel.app/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'verification2_homepage.png', fullPage: true });

  // 2. Storefront
  console.log("Verifying Storefront...");
  await page.goto('https://card-bound.vercel.app/alexthegrader', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'verification2_storefront.png', fullPage: true });

  // 3. Navigation from listing to seller
  console.log("Verifying Listing -> Seller Navigation...");
  await page.goto('https://card-bound.vercel.app/listings/61', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'verification2_listing.png' });
  
  const viewSellerBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('a')).find(el => el.href.includes('/alexthegrader') && (el.textContent.includes('View Profile') || el.closest('.border')));
  });
  
  if (viewSellerBtn) {
    await viewSellerBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'verification2_listing_to_seller.png' });
  } else {
    // If we can't find a specific button, just screenshot the fallback
    console.log("Could not click view seller button");
  }

  await browser.close();
  console.log("Done.");
}

run().catch(console.error);
