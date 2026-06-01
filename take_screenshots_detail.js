const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  const baseUrl = 'https://card-bound-m5hyc22y3-jacksonrichardcastros-projects.vercel.app';
  
  // 1. Charizard Detail Page
  // Assuming ID 62 or 102. Let's try 62
  await page.goto(`${baseUrl}/listings/62`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_detail_charizard.png', fullPage: true });

  // 2. Ken Griffey Jr Detail Page
  // Assuming ID 67
  await page.goto(`${baseUrl}/listings/67`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_detail_griffey.png', fullPage: true });

  // 3. Pikachu Illustrator MP Detail Page
  // Let's use ID 125 for 1998 Pikachu Illustrator #3 (MP)
  await page.goto(`${baseUrl}/listings/125`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_detail_pikachu.png', fullPage: true });

  // 4. Homepage (Trending, Featured, Beta pill)
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_homepage_final.png', fullPage: true });

  // 5. Storefront (Header strip, Binder grid)
  await page.goto(`${baseUrl}/alexthegrader`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_storefront_final.png', fullPage: true });

  await browser.close();
})();
