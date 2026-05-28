const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });
  
  const baseUrl = "https://card-bound-8scuzhkx2-jacksonrichardcastros-projects.vercel.app";
  
  await page.goto(`${baseUrl}/alexthegrader`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'alexthegrader-live.png', fullPage: true });

  await page.goto(`${baseUrl}/storefront_test`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'storefront_test-live.png', fullPage: true });

  await browser.close();
  console.log("Screenshots saved.");
})();
