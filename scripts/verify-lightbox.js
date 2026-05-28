const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });
  
  const baseUrl = "https://card-bound-dz8jtdrmc-jacksonrichardcastros-projects.vercel.app";
  
  // Navigate to homepage to find a valid listing
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
  
  // Find the first listing link
  const listingHref = await page.$eval('a[href^="/listings/"]', el => el.href);
  console.log("Found listing:", listingHref);
  
  // Navigate to it
  await page.goto(listingHref, { waitUntil: 'networkidle2' });
  
  // Wait for the hero image and click it to open lightbox
  await page.waitForSelector('.cursor-zoom-in');
  await page.click('.cursor-zoom-in');
  
  // Wait for the lightbox to appear
  await new Promise(r => setTimeout(r, 1000)); // give it a second for animation
  
  await page.screenshot({ path: 'lightbox-live.png', fullPage: true });

  await browser.close();
  console.log("Screenshot saved to lightbox-live.png.");
})();
