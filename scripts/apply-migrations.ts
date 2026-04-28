import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set in environment");
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), "src/lib/db/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });

  let ok = true;
  for (const file of files) {
    process.stdout.write(`>>> Applying ${file} ... `);
    const contents = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    try {
      await sql.unsafe(contents);
      console.log("ok");
    } catch (err: any) {
      if (err.code === '42P07' || err.code === '42701' || err.message?.includes('already exists')) {
        console.log("ok (already exists)");
      } else {
        console.log("FAILED");
        console.error(err);
        ok = false;
        break;
      }
    }
  }
  await sql.end();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
