import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('cards', 'listings', 'item_photos', 'category_memberships', 'view_history');
  `;
  const res = await sql.unsafe(query);
  console.log("FOREIGN KEY CONSTRAINTS:");
  for (const row of res) {
    console.log(`Table: ${row.table_name}, FK: ${row.column_name}, References: ${row.foreign_table_name}(${row.foreign_column_name}), ON DELETE: ${row.delete_rule}`);
  }

  await sql.end();
}

run().catch(console.error);
