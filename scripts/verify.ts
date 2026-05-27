const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const baseUrl = process.argv[2] || 'https://cardboard-audit-three.vercel.app'; // Fallback to the known alias if not provided

  console.log(`Verifying deployment at ${baseUrl}...`);

  // 1. Storefront test
  console.log('Taking screenshot: storefront_test.png');
  await page.goto(`${baseUrl}/storefront_test`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'storefront_test.png' });

  // 2. Open drawer
  console.log('Taking screenshot: drawer_open.png');
  await page.click('text=Filters');
  await page.waitForTimeout(1000); // Wait for animation
  await page.screenshot({ path: 'drawer_open.png' });

  // 3. Active chips
  console.log('Taking screenshot: active_chips.png');
  // Click a filter option (e.g., Sport -> TCG)
  // The label in drawer is "TCG", we can click it
  await page.click('text=Sport / Category');
  await page.waitForTimeout(500);
  await page.click('text=TCG');
  await page.click('text=Apply');
  await page.waitForTimeout(1500); // Wait for navigation and drawer close
  await page.screenshot({ path: 'active_chips.png' });

  // 4. Root dashboard sidebar
  console.log('Taking screenshot: dashboard_sidebar.png');
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'dashboard_sidebar.png' });

  // 5. Root dashboard filtered
  console.log('Taking screenshot: dashboard_filtered.png');
  await page.click('text=Sport / Category');
  await page.waitForTimeout(500);
  await page.click('text=TCG'); // Click TCG filter on sidebar
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'dashboard_filtered.png' });

  await browser.close();
  console.log('Verification complete.');
})();
