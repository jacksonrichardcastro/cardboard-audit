import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1024 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  const url = "https://card-bound-mgfbxeqik-jacksonrichardcastros-projects.vercel.app";
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: "networkidle" });
  
  // Wait a moment for any dynamic stuff
  await page.waitForTimeout(2000);
  
  // 1. Dashboard at first load with all filter sections collapsed
  console.log("Capturing dashboard_collapsed.png...");
  await page.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/dashboard_collapsed.png", fullPage: true });
  
  // 2. Sidebar with tighter label-to-chevron spacing and narrower overall width
  console.log("Capturing sidebar_tighter.png...");
  const sidebar = await page.locator(".w-40.shrink-0");
  await sidebar.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sidebar_tighter.png" });
  
  // 3. Trending grid populated with real PSA-slab card images, no gray placeholder boxes
  console.log("Capturing trending_real_images.png...");
  const trendingGrid = await page.locator(".w-full.overflow-x-auto").first();
  await trendingGrid.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/trending_real_images.png" });
  
  // 4. One screenshot of a filter section expanded
  console.log("Capturing sidebar_expanded.png...");
  const sportButton = await page.locator("text=Sport / Category");
  await sportButton.click();
  await page.waitForTimeout(500); // let it expand
  await sidebar.screenshot({ path: "/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/sidebar_expanded.png" });
  
  await browser.close();
  console.log("Screenshots captured successfully!");
}

main().catch(console.error);
