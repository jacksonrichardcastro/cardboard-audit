const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  console.log("Navigating to sign up...");
  await page.goto('https://card-bound-2o51msrtp-jacksonrichardcastros-projects.vercel.app/sign-up', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'clerk-signup-1.png' });
  
  try {
    const emailInput = await page.$('input[name="emailAddress"]');
    if (emailInput) {
      await emailInput.type(`test-${Date.now()}@trax-internal.test`);
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'clerk-signup-2.png' });
      
      const codeInput = await page.$('input[name="code"], input[name="ticket"]');
      if (codeInput) {
         await codeInput.type('424242');
         await new Promise(r => setTimeout(r, 3000));
         await page.screenshot({ path: 'clerk-signup-3.png' });
      }
    }
  } catch (err) {
    console.error(err);
  }
  
  // Now navigate to /listings/122
  console.log("Navigating to listing...");
  await page.goto('https://card-bound-2o51msrtp-jacksonrichardcastros-projects.vercel.app/listings/122', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'clerk-signup-4-listing.png' });
  
  await browser.close();
})();
