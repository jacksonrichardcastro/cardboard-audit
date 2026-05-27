const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const baseUrl = process.argv[2] || 'https://cardboard-audit-three.vercel.app'; // Fallback to the known alias if not provided

  console.log(`Verifying deployment at ${baseUrl}...`);

  const outDir = '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b';
  // 1. Storefront test
  console.log('Taking screenshot: storefront_test.png');
  await page.goto(`${baseUrl}/storefront_test`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/storefront_test.png` });

  // 2. Open drawer
  console.log('Taking screenshot: drawer_open.png');
  await page.click('text=Filters');
  await page.waitForTimeout(1000); // Wait for animation
  await page.screenshot({ path: `${outDir}/drawer_open.png` });

  // 3. Active chips
  console.log('Taking screenshot: active_chips.png');
  await page.goto(`${baseUrl}/storefront_test?sport=tcg.pokemon`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/active_chips.png` });

  // 4. Root dashboard sidebar
  console.log('Taking screenshot: dashboard_sidebar.png');
  await page.goto(`${baseUrl}/`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/dashboard_sidebar.png` });

  // 5. Root dashboard filtered
  console.log('Taking screenshot: dashboard_filtered.png');
  await page.goto(`${baseUrl}/?sport=tcg.pokemon`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/dashboard_filtered.png` });

  await browser.close();
  console.log('Verification complete.');
})();
