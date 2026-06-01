import { chromium, devices } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro'],
    deviceScaleFactor: 3, // For higher quality screenshots
  });
  const page = await context.newPage();
  
  const baseDir = '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/artifacts';

  console.log("Navigating to production...");
  await page.goto('https://card-bound.vercel.app', { waitUntil: 'networkidle' });

  // Fix CC + 6b: Mobile Menu
  console.log("Testing Mobile Menu...");
  await page.click('button:has(svg.lucide-menu)'); // Hamburger menu trigger
  await page.waitForSelector('text=For You', { state: 'visible' });
  await page.waitForTimeout(500); // Wait for drawer animation
  await page.screenshot({ path: path.join(baseDir, 'fix_cc_6b.png') });
  
  // Close menu
  await page.click('button:has(svg.lucide-x), .fixed.inset-0.bg-black\\/80'); // Assuming sheet has X or backdrop
  await page.waitForTimeout(500);

  // Fix DD: Profile name layout
  // We need to visit a profile, e.g. /alexthegrader
  console.log("Testing Profile Layout...");
  await page.goto('https://card-bound.vercel.app/alexthegrader', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // let images load
  await page.screenshot({ path: path.join(baseDir, 'fix_dd.png') });

  // Fix GG & 9: Filters overlay
  console.log("Testing Filters...");
  // Find "Filters" button and click it
  const filterBtn = await page.$('button:has-text("Filters")');
  if (filterBtn) {
    await filterBtn.click();
    await page.waitForSelector('text=Filters', { state: 'visible' });
    await page.waitForTimeout(500); // Wait for drawer animation
    await page.screenshot({ path: path.join(baseDir, 'fix_gg.png') });

    // Click Trax logo (top left)
    console.log("Clicking Trax Logo through overlay...");
    await page.mouse.click(50, 30); // Coordinate where Trax logo usually is
    await page.waitForTimeout(1000); // Wait for navigation
    
    // We should be on home page
    await page.screenshot({ path: path.join(baseDir, 'fix_9.png') });
  } else {
    console.log("Could not find Filters button on /alexthegrader");
  }

  await browser.close();
  console.log("Done!");
})();
