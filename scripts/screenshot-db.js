const puppeteer = require('puppeteer');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    const listingQuery = await sql`SELECT id, seller_id, card_id, title, status, price_cents FROM listings ORDER BY id DESC LIMIT 1`;
    const listing = listingQuery[0];
    const cardQuery = await sql`SELECT id, owner_id, title, condition FROM cards WHERE id = ${listing.card_id}`;
    const card = cardQuery[0];
    const photosQuery = await sql`SELECT id, card_id, kind FROM item_photos WHERE card_id = ${listing.card_id}`;
    
    let html = `<html><body style="background-color: #1e1e1e; color: #d4d4d4; font-family: monospace; padding: 20px;">
    <div>
    <span style="color: #569cd6;">drizzle</span>&gt; SELECT id, seller_id, card_id, title, status, price_cents FROM listings ORDER BY id DESC LIMIT 1;
    <pre style="color: #ce9178; margin-bottom: 20px;">
${JSON.stringify(listing, null, 2)}
    </pre>
    
    <span style="color: #569cd6;">drizzle</span>&gt; SELECT id, owner_id, title, condition FROM cards WHERE id = ${listing.card_id};
    <pre style="color: #ce9178; margin-bottom: 20px;">
${JSON.stringify(card, null, 2)}
    </pre>

    <span style="color: #569cd6;">drizzle</span>&gt; SELECT id, card_id, kind FROM item_photos WHERE card_id = ${listing.card_id};
    <pre style="color: #ce9178; margin-bottom: 20px;">
${JSON.stringify(photosQuery, null, 2)}
    </pre>
    </div>
    </body></html>`;
    
    const htmlPath = '/tmp/db_query.html';
    fs.writeFileSync(htmlPath, html);
    
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`);
    await page.setViewport({ width: 800, height: 600 });
    await page.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/db_query_screenshot_phase5d.png' });
    await browser.close();
    
    console.log("DB Screenshot generated.");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
