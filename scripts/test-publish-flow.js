const { createClerkClient } = require('@clerk/backend');
const puppeteer = require('puppeteer');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

(async () => {
  try {
    const domain = process.argv[2] || 'http://localhost:3000';
    
    // Create a dummy image file for upload testing
    const testImagePath = path.join(__dirname, 'test-card.jpg');
    // Using a 1x1 black JPEG base64 representation just to have a valid file to upload
    const base64Data = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    fs.writeFileSync(testImagePath, Buffer.from(base64Data, 'base64'));

    const usersList = await clerk.users.getUserList({ limit: 1 });
    const realClerkUserId = usersList.data[0].id;
    
    // Ensure user has approved profile
    await sql`UPDATE profiles SET application_status = 'approved', handle = 'real_test_owner' WHERE user_id = ${realClerkUserId}`;

    const token = await clerk.signInTokens.createSignInToken({ userId: realClerkUserId, expiresInSeconds: 60 });
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000 });

    console.log("Signing in...");
    await page.goto(`${domain}/sign-in?__clerk_ticket=${token.token}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));

    console.log("Navigating to /sell/new...");
    await page.goto(`${domain}/sell/new`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));

    // Fill Step 1
    console.log("Filling Step 1...");
    const inputs = await page.$$('input');
    await inputs[0].type('Bobby Witt Jr.'); // subject
    await inputs[1].type('Topps Chrome');   // set
    await inputs[2].type('2023');           // year
    await inputs[3].type('150');            // card number
    await inputs[4].type('Refractor');      // edition
    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 1000));

    // Fill Step 2
    console.log("Filling Step 2...");
    const selects = await page.$$('select');
    await selects[0].select('Near Mint or Better');
    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 1000));

    // Step 3 - Photo upload
    console.log("Uploading photo in Step 3...");
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(testImagePath);
    await new Promise(r => setTimeout(r, 5000));
    
    // Upload second photo because ungraded cards require 2 photos
    await fileInput.uploadFile(testImagePath);
    await new Promise(r => setTimeout(r, 5000));
    
    // Screenshot Step 3 to show upload UI and result
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/step3_upload.png' });
    console.log("Step 3 screenshot saved!");

    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 1000));

    // Fill Step 4
    console.log("Filling Step 4...");
    const priceInput = await page.$('input[type="number"]');
    await priceInput.type('125.00');
    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 1000));

    // Step 5 - Review and Publish
    console.log("Clicking Review & Publish...");
    // Let auto-save run
    await new Promise(r => setTimeout(r, 2000));
    
    // Try publishing normally
    await page.click('button::-p-text(Review & Publish)');
    
    console.log("Waiting for redirect to /listings/[id]...");
    await new Promise(r => setTimeout(r, 6000));
    const url = page.url();
    console.log("Current URL after publish:", url);
    
    if (url.includes('/listings/')) {
       console.log("Successfully published! Capturing listing screenshot...");
       await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/listing_detail.png', fullPage: true });
    } else {
       console.log("Failed to redirect. Capturing error state...");
       await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/publish_error.png' });
    }

    // Now test Storefront pill
    console.log("Navigating to storefront to verify LISTED pill...");
    await page.goto(`${domain}/real_test_owner?tab=binder`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/storefront_listed.png' });
    
    // Now test Demo Mode bypass
    console.log("Testing Demo Mode submission...");
    await page.goto(`${domain}/sell/new?demo=1`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    
    const demoInputs = await page.$$('input');
    await demoInputs[0].type('Demo Card'); 
    await demoInputs[1].type('Demo Set');   
    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 1000));
    
    const demoSelects = await page.$$('select');
    await demoSelects[0].select('Poor');
    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 1000));
    
    const demoFileInput = await page.$('input[type="file"]');
    await demoFileInput.uploadFile(testImagePath);
    await new Promise(r => setTimeout(r, 5000));
    
    await demoFileInput.uploadFile(testImagePath);
    await new Promise(r => setTimeout(r, 5000));
    
    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 1000));
    
    const demoPriceInput = await page.$('input[type="number"]');
    await demoPriceInput.type('50.00');
    await page.click('button::-p-text(Next)');
    await new Promise(r => setTimeout(r, 3000));
    
    // Click Review and Publish in Demo mode - it should trigger an alert
    page.on('dialog', async dialog => {
      console.log("Dialog message:", dialog.message());
      await dialog.accept();
    });
    
    await page.click('button::-p-text(Review & Publish)');
    await new Promise(r => setTimeout(r, 3000));
    console.log("Demo test complete.");

    // Extract listing ID from url to fetch from DB
    const listingIdMatch = url.match(new RegExp('/listings/(\\\\d+)'));
    if (listingIdMatch) {
      const listingId = parseInt(listingIdMatch[1]);
      
      const newListing = await sql`SELECT * FROM listings WHERE id = ${listingId}`;
      const newCard = await sql`SELECT * FROM cards WHERE id = ${newListing[0].card_id}`;
      const newPhotos = await sql`SELECT * FROM item_photos WHERE card_id = ${newListing[0].card_id}`;
      
      console.log("DB RESULT FOR LISTING:", newListing[0]);
      console.log("DB RESULT FOR CARD:", newCard[0]);
      console.log("DB RESULT FOR PHOTOS:", newPhotos);
    }

    await browser.close();
    fs.unlinkSync(testImagePath);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
