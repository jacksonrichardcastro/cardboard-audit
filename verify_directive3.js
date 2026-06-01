const puppeteer = require('puppeteer');
const fs = require('fs');

async function runVerification() {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  const BASE_URL = 'https://card-bound.vercel.app';
  
  console.log("Navigating to Anonymous Homepage...");
  await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'verification_anon_home.png', fullPage: true });

  console.log("Navigating to Alex Storefront...");
  await page.goto(`${BASE_URL}/alexthegrader`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'verification_alexthegrader_desktop.png', fullPage: true });

  console.log("Changing to Mobile Viewport for Storefront...");
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verification_alexthegrader_mobile.png', fullPage: true });

  console.log("Testing Mobile Menu...");
  await page.click('button:has(svg.lucide-menu)');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'verification_mobile_menu.png' });

  console.log("Navigating to Listing Detail Page on Mobile...");
  await page.goto(`${BASE_URL}/listings/1`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'verification_listing_mobile.png', fullPage: true });

  console.log("Changing back to Desktop Viewport...");
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Testing QuickUploadModal as Owner...");
  await page.goto(`${BASE_URL}/listings/1`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'verification_listing_desktop.png', fullPage: true });

  await browser.close();
  console.log("Verification screenshots captured.");
}

runVerification().catch(console.error);
