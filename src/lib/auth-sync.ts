import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function syncUserFromClerk() {
  const { userId } = await auth();
  if (!userId) return null;

  // Fast path — if the user already exists in the local users table,
  // skip the Clerk API call entirely.
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing) return userId;

  // Slow path — only hit Clerk API if the user isn't local yet.
  // Catch errors so a network blip doesn't 500 the whole seller flow.
  try {
    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    await db
      .insert(users)
      .values({ id: user.id, email, role: "buyer" })
      .onConflictDoUpdate({
        target: users.id,
        set: { email },
      });

    return user.id;
  } catch (err) {
    console.error("[syncUserFromClerk] Failed to sync from Clerk:", err);
    return null;
  }
}
