const puppeteer = require("puppeteer");
const fs = require("fs");

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  
  // 1. Mobile Storefront
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto("http://localhost:3000/sellers/alexthegrader?tab=active-listings");
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: "mobile_storefront.png", fullPage: true });

  // 2. Mobile Detail Page
  await page.goto("http://localhost:3000/listings/61");
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: "mobile_detail.png", fullPage: true });

  // 3. Desktop Admin
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/admin");
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: "desktop_admin.png", fullPage: true });

  // 4. Desktop Homepage
  await page.goto("http://localhost:3000/");
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: "desktop_homepage.png", fullPage: true });

  await browser.close();
  console.log("Screenshots taken.");
}
main().catch(console.error);
