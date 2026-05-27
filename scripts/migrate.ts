import dotenv from "dotenv";
dotenv.config({ path: ".env.vercel" });
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function main() {
  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, "../src/lib/db/migrations/0003_icy_bulldozer.sql"), "utf-8");
    
    // Split on --> statement-breakpoint
    const statements = migrationSql.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s.length > 0);
    
    for (const stmt of statements) {
      console.log("Executing:", stmt);
      await db.execute(sql.raw(stmt));
    }
    console.log("Migration 0003 successful.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
