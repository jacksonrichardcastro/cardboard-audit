require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    // Pre-UPDATE query
    console.log("--- Pre-UPDATE ---");
    const preUsers = await sql`
      SELECT u.role, u.account_type, p.kyc_status 
      FROM users u 
      JOIN profiles p ON u.id = p.user_id 
      WHERE p.handle = 'alexthegrader'
    `;
    console.log("Alex account pre-update:", preUsers);

    // Update profiles (kyc_status)
    await sql`UPDATE profiles SET kyc_status = 'verified' WHERE handle = 'alexthegrader'`;
    
    // Update users (role and account_type)
    await sql`
      UPDATE users 
      SET role = 'seller', account_type = 'seller' 
      WHERE id = (SELECT user_id FROM profiles WHERE handle = 'alexthegrader')
    `;

    // Post-UPDATE query
    console.log("--- Post-UPDATE ---");
    const postUsers = await sql`
      SELECT u.role, u.account_type, p.kyc_status 
      FROM users u 
      JOIN profiles p ON u.id = p.user_id 
      WHERE p.handle = 'alexthegrader'
    `;
    console.log("Alex account post-update:", postUsers);
    
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
