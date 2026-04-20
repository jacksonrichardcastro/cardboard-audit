import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { env } from "@/env";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;

// Disable prepare for PgBouncer / standard Serverless Postgres
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// P0-5: Absolute Isolation Wrapper resolving multi-tenant architectures natively.
export async function withUserContext<T>(userId: string, callback: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    // Assert current_setting('app.current_user_id') within PostgreSQL securely!
    await tx.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
    return await callback(tx);
  });
}
