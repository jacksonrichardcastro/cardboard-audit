import puppeteer from 'puppeteer';

async function main() {
  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });
  
  const url = "https://card-bound-96seg8llt-jacksonrichardcastros-projects.vercel.app";
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Wait a moment for any dynamic stuff
  await new Promise(r => setTimeout(r, 4000));
  
  // 1. Dashboard at first load with all filter sections collapsed
  console.log("Capturing dashboard_collapsed.png...");
  await page.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/dashboard_collapsed.png", fullPage: true });
  
  // 2. Sidebar with tighter label-to-chevron spacing and narrower overall width
  console.log("Capturing sidebar_tighter.png...");
  const sidebar = await page.$('.w-40.shrink-0');
  if (sidebar) {
    await sidebar.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sidebar_tighter.png" });
  } else {
    console.log("Sidebar not found!");
  }
  
  // 3. Trending grid populated with real PSA-slab card images, no gray placeholder boxes
  console.log("Capturing trending_real_images.png...");
  const trendingGrid = await page.$('.w-full.overflow-x-auto');
  if (trendingGrid) {
    await trendingGrid.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/trending_real_images.png" });
  } else {
    console.log("Trending grid not found!");
  }
  
  // 4. One screenshot of a filter section expanded
  console.log("Capturing sidebar_expanded.png...");
  // Find a button containing the text "Sport / Category"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Sport / Category')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }
  if (sidebar) {
    await sidebar.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sidebar_expanded.png" });
  }
  
  await browser.close();
  console.log("Screenshots captured successfully!");
}

main().catch(console.error);
