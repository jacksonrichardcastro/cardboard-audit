const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  const baseUrl = 'https://card-bound-7upwx312b-jacksonrichardcastros-projects.vercel.app';
  
  // 1. Ken Griffey Jr listing detail page
  await page.goto(`${baseUrl}/listings/67`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_griffey_detail.png', fullPage: true });

  // 2. Catalog search for "Charizard"
  await page.goto(`${baseUrl}/search?q=Charizard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_charizard_search.png', fullPage: true });

  // 3. Alex's full storefront
  await page.goto(`${baseUrl}/alexthegrader`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_alex_storefront.png', fullPage: true });

  // 4. Test pending listing detail page
  await page.goto(`${baseUrl}/listings/180`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_pending_detail.png', fullPage: true });

  await browser.close();
})();
