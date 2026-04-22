import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { env } from "@/env";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;

// Disable prepare for PgBouncer / standard Serverless Postgres
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

/**
 * Run `callback` inside a transaction with `app.current_user_id` scoped to
 * the given actor, so RLS policies (which key off
 * `current_setting('app.current_user_id')`) enforce tenant isolation.
 *
 * IMPORTANT: the userId is bound through PostgreSQL's `set_config(...)` via a
 * parameterized query rather than `sql.raw` string interpolation. Clerk user
 * IDs happen to be alphanumeric and would rarely exploit `sql.raw` in
 * practice, but "system" / "anon" / admin-provided actor strings flow
 * through the same path, and interpolating them into raw SQL is a SQL
 * injection class bug.
 */
export async function withUserContext<T>(
  userId: string | null | undefined,
  callback: (tx: any) => Promise<T>,
): Promise<T> {
  const resolvedActor = userId && userId.length > 0 ? userId : "anon";
  return await db.transaction(async (tx) => {
    // set_config(setting, value, is_local) — is_local=true scopes to this tx.
    // The value is bound as a parameter, so quotes/semicolons in the actor
    // id can't escape out of the string literal.
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${resolvedActor}, true)`,
    );
    return await callback(tx);
  });
}
