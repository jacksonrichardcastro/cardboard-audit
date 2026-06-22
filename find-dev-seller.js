const postgres = require('postgres');
async function run() {
  const sql = postgres('postgresql://postgres.zztcxiiptdbkfwlflgdh:OTKTle3FZIpJnOUIQEadPJgnWN6RbiGJ@aws-1-us-east-2.pooler.supabase.com:6543/postgres');
  const res = await sql`SELECT user_id, handle FROM storefronts WHERE handle ILIKE '%test%' OR handle ILIKE '%dev%' LIMIT 1;`;
  console.table(res);
  await sql.end();
}
run();
