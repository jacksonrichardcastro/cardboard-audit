const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  const baseUrl = 'https://card-bound-7upwx312b-jacksonrichardcastros-projects.vercel.app';
  
  // 2. Marketplace homepage
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_homepage_beta.png', fullPage: true });

  // 3. Storefront
  await page.goto(`${baseUrl}/storefront_test`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_storefront_test.png', fullPage: true });

  // 4. Catalog Search
  await page.goto(`${baseUrl}/search?q=Beta+Test+Charizard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_search_invisible.png', fullPage: true });

  // 5. Listing Detail (Pending)
  await page.goto(`${baseUrl}/listings/180`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_detail_disabled.png', fullPage: true });

  // 6. Admin Dashboard
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_admin_queue.png', fullPage: true });

  // 7. Activate All Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Activate All'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshot_admin_modal.png', fullPage: true });

  // 8. Confirm Activation
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirm = btns.find(b => b.textContent.includes('Confirm & Activate All'));
    if (confirm) confirm.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // 8a. Post-Activation Search
  await page.goto(`${baseUrl}/search?q=Beta+Test+Charizard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_after_activate_search.png', fullPage: true });

  // 8b. Post-Activation Detail
  await page.goto(`${baseUrl}/listings/180`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_after_activate_detail.png', fullPage: true });

  await browser.close();
})();
