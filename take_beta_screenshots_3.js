const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  const baseUrl = 'https://card-bound-7upwx312b-jacksonrichardcastros-projects.vercel.app';
  
  // 1. Ken Griffey Jr listing detail page
  await page.goto(`${baseUrl}/listings/67`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_griffey_detail_2.png', fullPage: true });

  // 2. Alex's full storefront (Note: URL is /alexthegrader)
  await page.goto(`${baseUrl}/alexthegrader`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_alex_storefront_2.png', fullPage: true });

  // 3. Homepage with Trending + Featured rows
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_homepage_beta_2.png', fullPage: true });

  await browser.close();
})();
