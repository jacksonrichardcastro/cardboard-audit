import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  const accounts = ['bofascards', 'jacksons'];
  for (const handle of accounts) {
    console.log(`\n--- ${handle} ---`);
    const [storefront] = await sql`SELECT * FROM storefronts WHERE handle = ${handle}`;
    if (!storefront) continue;
    
    console.log('Storefront Layout:', storefront.layout);
    console.log('Storefront Header Customization Ids:', storefront.header_customization_ids);
    
    const categories = await sql`SELECT id FROM categories WHERE storefront_id = ${storefront.id}`;
    console.log('Categories count:', categories.length);
    
    const listings = await sql`SELECT id, price_cents, discount_type, discount_amount FROM listings WHERE seller_id = ${storefront.user_id}`;
    console.log('Listings count:', listings.length);
    if (listings.length > 0) {
       console.log('Listings with discounts:', listings.filter(l => l.discount_type != null).length);
    }
  }
  process.exit(0);
}
run().catch(console.error);
