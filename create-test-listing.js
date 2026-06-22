const postgres = require('postgres');
async function run() {
  const sql = postgres('postgresql://postgres.zztcxiiptdbkfwlflgdh:OTKTle3FZIpJnOUIQEadPJgnWN6RbiGJ@aws-1-us-east-2.pooler.supabase.com:6543/postgres');
  
  const [storefront] = await sql`SELECT id, handle FROM storefronts WHERE handle ILIKE '%test%' OR handle ILIKE '%dev%' LIMIT 1;`;
  
  const [card] = await sql`
    INSERT INTO cards (owner_id, title, category, condition) 
    VALUES ('seller-storefront', 'Test Multi-Quantity Card', 'Trading Cards', 'Near Mint') 
    RETURNING id;
  `;
  
  const [listing] = await sql`
    INSERT INTO listings (card_id, seller_id, storefront_id, title, price_cents, condition, quantity, status, category)
    VALUES (${card.id}, 'seller-storefront', ${storefront.id}, 'Test Multi-Quantity Listing', 1000, 'Near Mint', 3, 'active', 'Trading Cards')
    RETURNING id;
  `;
  
  console.log('NEW_LISTING_ID=' + listing.id);
  console.log('SELLER_HANDLE=' + storefront.handle);
  console.log('QUANTITY=3');
  console.log('CARD_ID=' + card.id);
  
  await sql.end();
}
run();
